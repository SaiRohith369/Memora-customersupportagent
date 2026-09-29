/**
 * Hindsight memory service.
 * Uses the official @vectorize-io/hindsight-client when HINDSIGHT_BASE_URL / HINDSIGHT_API_KEY are set.
 * Falls back to seeded local memory so the demo works on Netlify without credentials.
 */

import { getMemoriesForCustomer, addMemory, getCustomer } from '@/data/seed';
import type { MemoryItem, MemoryType } from '@/types';

const HINDSIGHT_BASE_URL =
  process.env.HINDSIGHT_BASE_URL ||
  process.env.HINDSIGHT_URL ||
  process.env.HINDSIGHT_API_URL ||
  '';
const HINDSIGHT_API_KEY = process.env.HINDSIGHT_API_KEY || '';

let client: any = null;
let clientInitFailed = false;

async function getClient() {
  if (clientInitFailed) return null;
  if (client) return client;
  if (!HINDSIGHT_BASE_URL) {
    clientInitFailed = true;
    return null;
  }
  try {
    const { HindsightClient } = await import('@vectorize-io/hindsight-client');
    client = new HindsightClient({
      baseUrl: HINDSIGHT_BASE_URL,
      apiKey: HINDSIGHT_API_KEY || undefined,
    });
    return client;
  } catch (e) {
    console.warn('[hindsight] Client init failed, using local fallback:', e);
    clientInitFailed = true;
    return null;
  }
}

function bankIdForCustomer(customerId: string) {
  return `supportmemory-${customerId}`;
}

async function ensureBank(customerId: string) {
  const c = await getClient();
  if (!c) return false;
  const bankId = bankIdForCustomer(customerId);
  const customer = getCustomer(customerId);
  try {
    await c.createBank(bankId, {
      name: customer ? `Support memory: ${customer.name}` : bankId,
      mission:
        'You are the long-term memory for a customer support agent. Track issues, successful and failed solutions, environment, preferences, sentiment, and recurring patterns so future support is personalized.',
      disposition: { skepticism: 2, literalism: 3, empathy: 4 },
    });
    return true;
  } catch {
    // Bank may already exist
    return true;
  }
}

export async function isHindsightConnected(): Promise<boolean> {
  const c = await getClient();
  if (!c) return false;
  try {
    if (typeof c.getVersion === 'function') {
      await c.getVersion();
      return true;
    }
    return true;
  } catch {
    return false;
  }
}

export interface RetrievedMemory {
  text: string;
  type?: string;
  source?: 'hindsight' | 'local';
}

/**
 * Retrieve relevant memories for a customer + query.
 */
export async function retrieveCustomerMemory(
  customerId: string,
  query: string
): Promise<{ memories: RetrievedMemory[]; source: 'hindsight' | 'local'; activity: string }> {
  const c = await getClient();
  if (c) {
    try {
      await ensureBank(customerId);
      const bankId = bankIdForCustomer(customerId);
      const response = await c.recall(bankId, query, {
        budget: 'mid',
        maxTokens: 2048,
      });
      const results: RetrievedMemory[] = (response?.results || []).map((r: any) => ({
        text: r.text || r.content || String(r),
        type: r.type,
        source: 'hindsight' as const,
      }));
      if (results.length > 0) {
        return {
          memories: results,
          source: 'hindsight',
          activity: `${results.length} relevant memories found (Hindsight)`,
        };
      }
    } catch (e) {
      console.warn('[hindsight] recall failed, falling back to local:', e);
    }
  }

  // Local fallback: keyword + type relevance over seed memories
  const local = getMemoriesForCustomer(customerId);
  const q = query.toLowerCase();
  const keywords = q.split(/\s+/).filter((w) => w.length > 2);
  const scored = local.map((m) => {
    const text = m.content.toLowerCase();
    let score = 0;
    for (const k of keywords) {
      if (text.includes(k)) score += 2;
    }
    if (
      /login|sign.?in|password|auth/.test(q) &&
      /login|session|cookie|auth|password/.test(text)
    )
      score += 5;
    if (
      /payment|billing|subscription|invoice|card/.test(q) &&
      /payment|billing|subscription|invoice|card/.test(text)
    )
      score += 5;
    if (
      /api|webhook|rate.?limit|401|sdk/.test(q) &&
      /api|webhook|rate|401|sdk|key/.test(text)
    )
      score += 5;
    if (m.type === 'successful_solution') score += 3;
    if (m.type === 'recurring_pattern' || m.type === 'issue') score += 2;
    if (m.type === 'environment') score += 1;
    return { m, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score > 0).slice(0, 8);
  const memories: RetrievedMemory[] =
    top.length > 0
      ? top.map(({ m }) => ({
          text: m.content,
          type: m.type,
          source: 'local',
        }))
      : local.slice(0, 5).map((m) => ({
          text: m.content,
          type: m.type,
          source: 'local',
        }));

  return {
    memories,
    source: 'local',
    activity:
      memories.length > 0
        ? `${memories.length} relevant memories found`
        : 'No prior memories for this customer',
  };
}

/**
 * Store a durable fact into Hindsight (and local store).
 */
export async function storeCustomerMemory(
  customerId: string,
  content: string,
  options?: {
    type?: MemoryType;
    context?: string;
    metadata?: Record<string, string>;
    confidence?: MemoryItem['confidence'];
  }
): Promise<MemoryItem> {
  const memory: MemoryItem = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    customerId,
    type: options?.type || 'other',
    content,
    confidence: options?.confidence || 'recently_observed',
    date: new Date().toISOString().slice(0, 10),
    metadata: options?.metadata,
  };

  // Always keep local copy for UI
  addMemory(memory);

  const c = await getClient();
  if (c) {
    try {
      await ensureBank(customerId);
      const bankId = bankIdForCustomer(customerId);
      await c.retain(bankId, content, {
        context: options?.context || `customer_support:${options?.type || 'fact'}`,
        metadata: {
          customerId,
          type: options?.type || 'other',
          ...options?.metadata,
        },
        async: false,
      });
    } catch (e) {
      console.warn('[hindsight] retain failed (local store still updated):', e);
    }
  }

  return memory;
}

/**
 * Seed a customer's bank with existing local memories (call once per demo customer).
 */
export async function seedCustomerBank(customerId: string): Promise<void> {
  const c = await getClient();
  if (!c) return;
  try {
    await ensureBank(customerId);
    const bankId = bankIdForCustomer(customerId);
    const local = getMemoriesForCustomer(customerId);
    if (local.length === 0) return;
    const items = local.map((m) => ({
      content: m.content,
      context: `seed:${m.type}`,
      metadata: { type: m.type, source: m.source || 'seed' },
    }));
    if (typeof c.retainBatch === 'function') {
      await c.retainBatch(bankId, items, { async: false });
    } else {
      for (const item of items) {
        await c.retain(bankId, item.content, {
          context: item.context,
          metadata: item.metadata,
          async: false,
        });
      }
    }
  } catch (e) {
    console.warn('[hindsight] seed bank failed:', e);
  }
}

export async function listCustomerMemoriesFromHindsight(
  customerId: string
): Promise<RetrievedMemory[]> {
  const c = await getClient();
  if (!c) return [];
  try {
    const bankId = bankIdForCustomer(customerId);
    if (typeof c.listMemories === 'function') {
      const res = await c.listMemories(bankId, { limit: 50 });
      const items = res?.items || res?.results || [];
      return items.map((m: any) => ({
        text: m.text || m.content || String(m),
        type: m.type || m.fact_type,
        source: 'hindsight' as const,
      }));
    }
  } catch {
    /* ignore */
  }
  return [];
}
