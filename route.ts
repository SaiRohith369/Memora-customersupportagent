import { NextRequest, NextResponse } from 'next/server';
import {
  getCustomer,
  getTicketsForCustomer,
  addTicket,
  getMemoriesForCustomer,
} from '@/data/seed';
import {
  retrieveCustomerMemory,
  storeCustomerMemory,
} from '@/lib/hindsight';
import { generateSupportResponse } from '@/lib/ai';
import type { ChatRequest, ChatResponse, ConversationMessage } from '@/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest;
    const {
      customerId,
      message,
      memoryEnabled = true,
      conversationHistory = [],
    } = body;

    if (!customerId || !message?.trim()) {
      return NextResponse.json(
        { error: 'customerId and message are required' },
        { status: 400 }
      );
    }

    const customer = getCustomer(customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    let memories: Awaited<ReturnType<typeof retrieveCustomerMemory>>['memories'] = [];
    let activity = 'Searching customer memory...';
    let memorySource: 'hindsight' | 'local' = 'local';

    if (memoryEnabled) {
      const retrieved = await retrieveCustomerMemory(customerId, message);
      memories = retrieved.memories;
      activity = retrieved.activity;
      memorySource = retrieved.source;
    } else {
      activity = 'Memory OFF — generic mode';
    }

    const tickets = getTicketsForCustomer(customerId);
    const history = conversationHistory as ConversationMessage[];

    const aiResult = await generateSupportResponse({
      customer,
      message: message.trim(),
      memories,
      tickets,
      history,
      memoryEnabled,
    });

    // Persist new durable memories
    const newMemories = [];
    if (memoryEnabled && aiResult.memoryCandidates?.length) {
      for (const cand of aiResult.memoryCandidates) {
        if (!cand.content?.trim()) continue;
        const stored = await storeCustomerMemory(customerId, cand.content.trim(), {
          type: cand.type,
          confidence: cand.confidence,
          context: 'support_chat',
        });
        newMemories.push(stored);
      }
    }

    // Auto-create a lightweight ticket for significant issues
    let ticketCreated = undefined;
    const looksLikeIssue =
      /can't|cannot|not working|error|fail|issue|problem|broken|unable/i.test(
        message
      );
    if (looksLikeIssue && memoryEnabled) {
      const ticketId = `TKT-${Date.now().toString().slice(-6)}`;
      ticketCreated = addTicket({
        id: ticketId,
        customerId,
        date: new Date().toISOString().slice(0, 10),
        issue: message.slice(0, 120),
        status: 'in_progress',
        summary: `Opened from chat: ${message.slice(0, 80)}`,
      });
    }

    const response: ChatResponse = {
      reply: aiResult.response,
      memoriesUsed: aiResult.memoriesUsed || memories.slice(0, 5).map((m) => m.text),
      memoryUpdated: newMemories.length > 0,
      activity:
        newMemories.length > 0
          ? 'Memory updated'
          : aiResult.activity || activity,
      newMemories,
      ticketCreated,
    };

    return NextResponse.json({
      ...response,
      memorySource,
      allMemoriesCount: getMemoriesForCustomer(customerId).length,
    });
  } catch (e: any) {
    console.error('[api/chat]', e);
    return NextResponse.json(
      {
        error: 'Failed to process chat',
        reply:
          'Sorry — something went wrong on our side. Please try again in a moment.',
        memoriesUsed: [],
        memoryUpdated: false,
        activity: 'Error',
      },
      { status: 500 }
    );
  }
}
