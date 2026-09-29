import OpenAI from 'openai';
import type {
  Customer,
  MemoryItem,
  ConversationMessage,
  SupportResponse,
  MemoryCandidate,
  Ticket,
} from '@/types';
import type { RetrievedMemory } from './hindsight';

const SYSTEM_PROMPT = `You are a customer support agent for CloudDesk with access to long-term customer memory (powered by Hindsight).

Before answering a support request:
1. Review the customer's relevant memories carefully.
2. Identify previous related issues.
3. Identify solutions that worked.
4. Identify solutions that failed.
5. Identify the customer's environment and product.
6. Use this information to personalize the response.
7. Never claim to remember something unless it exists in the retrieved memory below.
8. Do not unnecessarily repeat questions that are already answered by memory.
9. If previous information may be outdated, confirm it briefly.
10. Prioritize previously successful solutions when the current problem appears similar.
11. Clearly distinguish remembered facts from assumptions.
12. If the problem is new, troubleshoot normally and extract useful information for future interactions.
13. Be empathetic but concise. Match the customer's communication preference when known.
14. When reusing a past fix, say so explicitly (e.g. "Last time, clearing the CloudDesk session resolved this.").

You must respond with valid JSON only, no markdown fences:
{
  "response": "Your natural language support reply to the customer",
  "memoryCandidates": [
    {
      "type": "issue|successful_solution|failed_solution|environment|preference|sentiment|recurring_pattern|product|account|timeline|other",
      "content": "Durable fact worth storing for next time",
      "confidence": "remembered|recently_observed|previously_successful|potentially_outdated"
    }
  ],
  "memoriesUsed": ["short phrase of each memory you actually used"],
  "activity": "one short status line e.g. Using previous successful resolution"
}

Only include memoryCandidates that are NEW or UPDATED durable facts from this turn. Do not re-store facts already in the memory list.`;

function buildContext(params: {
  customer: Customer;
  memories: RetrievedMemory[];
  tickets: Ticket[];
  history: ConversationMessage[];
  memoryEnabled: boolean;
}) {
  const { customer, memories, tickets, history, memoryEnabled } = params;

  let ctx = `## Customer Profile
- Name: ${customer.name}
- ID: ${customer.id}
- Email: ${customer.email}
- Company: ${customer.company || 'N/A'}
- Product: ${customer.product}
- Environment: ${customer.environment.os} + ${customer.environment.browser}${
    customer.environment.extra ? ` (${customer.environment.extra})` : ''
  }
- Communication preference: ${customer.communicationPreference}
`;

  if (memoryEnabled && memories.length > 0) {
    ctx += `\n## Retrieved Long-Term Memories (Hindsight)\n`;
    memories.forEach((m, i) => {
      ctx += `${i + 1}. [${m.type || 'fact'}] ${m.text}\n`;
    });
  } else if (!memoryEnabled) {
    ctx += `\n## Memory Status\nMemory is DISABLED for this request. Treat the customer as unknown. Ask diagnostic questions from scratch.\n`;
  } else {
    ctx += `\n## Retrieved Long-Term Memories\nNo prior memories found for this customer.\n`;
  }

  if (tickets.length > 0) {
    ctx += `\n## Recent Tickets\n`;
    tickets.slice(0, 5).forEach((t) => {
      ctx += `- ${t.id} (${t.date}) [${t.status}]: ${t.issue}${
        t.resolution ? ` → ${t.resolution}` : ''
      }\n`;
    });
  }

  if (history.length > 0) {
    ctx += `\n## Recent Conversation\n`;
    history.slice(-8).forEach((m) => {
      ctx += `${m.role === 'user' ? 'Customer' : 'Agent'}: ${m.content}\n`;
    });
  }

  return ctx;
}

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY || process.env.XAI_API_KEY;
  if (!key) return null;
  const baseURL = process.env.OPENAI_BASE_URL || process.env.XAI_BASE_URL;
  return new OpenAI({
    apiKey: key,
    ...(baseURL ? { baseURL } : {}),
  });
}

/**
 * Rule-based fallback when no LLM key is configured — still demonstrates memory.
 */
function fallbackResponse(params: {
  customer: Customer;
  message: string;
  memories: RetrievedMemory[];
  memoryEnabled: boolean;
}): SupportResponse {
  const { customer, message, memories, memoryEnabled } = params;
  const msg = message.toLowerCase();
  const isLogin =
    /login|log in|sign in|can't access|cannot access|password|auth/.test(msg);
  const isPayment =
    /payment|billing|subscription|invoice|card|renew/.test(msg);
  const isApi =
    /api|webhook|401|rate limit|sdk|integration|endpoint/.test(msg);

  if (!memoryEnabled) {
    if (isLogin) {
      return {
        response: `Hi! I'm sorry you're having trouble signing in. To help diagnose this, could you tell me:\n1. What operating system and browser you're using?\n2. Are you seeing any specific error message?\n3. Have you tried this before, and if so what did you try?`,
        memoryCandidates: [],
        memoriesUsed: [],
        activity: 'Memory OFF — generic troubleshooting',
      };
    }
    return {
      response: `Thanks for reaching out. Please describe your issue in a bit more detail, including your product, environment, and any error messages you see.`,
      memoryCandidates: [],
      memoriesUsed: [],
      activity: 'Memory OFF — generic response',
    };
  }

  const envMem = memories.find((m) => /windows|chrome|macos|safari|ubuntu|firefox/i.test(m.text));
  const successMem = memories.find(
    (m) =>
      /clear.*session|cookie|session\/cookie|resolved|worked|fixed/i.test(m.text) &&
      /login|session|cookie/i.test(m.text)
  );
  const recurring = memories.find((m) => /recurring|after.*update/i.test(m.text));
  const used: string[] = [];

  if (isLogin && (successMem || envMem)) {
    if (envMem) used.push(envMem.text);
    if (successMem) used.push(successMem.text);
    if (recurring) used.push(recurring.text);

    const envStr = envMem
      ? envMem.text.replace(/^Environment:\s*/i, '')
      : `${customer.environment.os} + ${customer.environment.browser}`;

    let response = `Welcome back, ${customer.name}. I remember you previously had a CloudDesk login issue`;
    if (envMem || customer.environment) {
      response += ` on ${envStr}`;
    }
    response += `.`;
    if (successMem) {
      response += ` Last time, clearing your CloudDesk session/cookies resolved it.`;
    }
    if (recurring) {
      response += ` This has also happened after product updates before.`;
    }
    response += ` Are you seeing the same problem this time? If so, we can try the same fix first.`;

    const candidates: MemoryCandidate[] = [];
    if (/update|today|again|still/.test(msg)) {
      candidates.push({
        type: 'recurring_pattern',
        content: 'Login issue recurred; customer mentioned update or repeat occurrence',
        confidence: 'recently_observed',
      });
      candidates.push({
        type: 'timeline',
        content: `${new Date().toISOString().slice(0, 10)}: Customer reported login issue again`,
        confidence: 'recently_observed',
      });
    }

    return {
      response,
      memoryCandidates: candidates,
      memoriesUsed: used,
      activity:
        successMem
          ? 'Using previous successful resolution'
          : `${used.length} relevant memories found`,
    };
  }

  if (isPayment) {
    const paySuccess = memories.find((m) => /card|payment|renewal/i.test(m.text));
    if (paySuccess) {
      return {
        response: `Hi ${customer.name}. I see you've had payment/subscription issues before. Last time, updating the card on file and retrying the payment resolved a declined renewal. Are you seeing a similar payment or invoice problem today?`,
        memoryCandidates: [],
        memoriesUsed: [paySuccess.text],
        activity: 'Using previous successful resolution',
      };
    }
  }

  if (isApi) {
    const apiSuccess = memories.find((m) => /api key|bearer|401|rate limit|batch/i.test(m.text));
    if (apiSuccess) {
      return {
        response: `Hi ${customer.name}. Looking at your history — you've hit API auth and rate-limit issues before. Rotating the API key with \`Authorization: Bearer <key>\` fixed 401s, and batch size 50 with exponential backoff helped with rate limits. What error are you seeing this time?`,
        memoryCandidates: [],
        memoriesUsed: [apiSuccess.text],
        activity: 'Using previous successful resolution',
      };
    }
  }

  // First-time / generic with memory of profile only
  return {
    response: `Hi ${customer.name}. Thanks for contacting CloudDesk support. I can see you're on ${customer.product} (${customer.environment.os} + ${customer.environment.browser}). How can I help you today?`,
    memoryCandidates: [
      {
        type: 'issue',
        content: `Customer reported: ${message.slice(0, 120)}`,
        confidence: 'recently_observed',
      },
    ],
    memoriesUsed: memories.slice(0, 2).map((m) => m.text),
    activity:
      memories.length > 0
        ? `${memories.length} relevant memories found`
        : 'New conversation — building memory',
  };
}

export async function generateSupportResponse(params: {
  customer: Customer;
  message: string;
  memories: RetrievedMemory[];
  tickets: Ticket[];
  history: ConversationMessage[];
  memoryEnabled: boolean;
}): Promise<SupportResponse> {
  const openai = getOpenAI();

  if (!openai) {
    return fallbackResponse(params);
  }

  const context = buildContext(params);
  const model =
    process.env.OPENAI_MODEL ||
    process.env.XAI_MODEL ||
    'gpt-4o-mini';

  try {
    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${context}\n\n## Current customer message\n${params.message}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw) as SupportResponse;
    return {
      response: parsed.response || 'Sorry, I had trouble generating a reply. Please try again.',
      memoryCandidates: Array.isArray(parsed.memoryCandidates)
        ? parsed.memoryCandidates
        : [],
      memoriesUsed: Array.isArray(parsed.memoriesUsed) ? parsed.memoriesUsed : [],
      activity: parsed.activity || 'Response generated',
    };
  } catch (e) {
    console.error('[ai] LLM error, using fallback:', e);
    return fallbackResponse(params);
  }
}
