import { Customer, Ticket, MemoryItem, DashboardStats } from '@/types';

export const customers: Customer[] = [
  {
    id: 'CUS-1024',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@acme.co',
    company: 'Acme Corp',
    product: 'CloudDesk Pro',
    environment: {
      os: 'Windows 11',
      browser: 'Chrome',
      extra: 'Company account',
    },
    communicationPreference: 'Concise technical instructions',
    avatarColor: 'bg-violet-500',
    createdAt: '2026-08-12',
  },
  {
    id: 'CUS-2048',
    name: 'David Miller',
    email: 'david.miller@techflow.io',
    company: 'TechFlow',
    product: 'CloudDesk Pro',
    environment: {
      os: 'macOS Sonoma',
      browser: 'Safari',
    },
    communicationPreference: 'Step-by-step with screenshots when possible',
    avatarColor: 'bg-sky-500',
    createdAt: '2026-07-03',
  },
  {
    id: 'CUS-3072',
    name: 'Emily Chen',
    email: 'emily.chen@datalink.dev',
    company: 'DataLink',
    product: 'CloudDesk API',
    environment: {
      os: 'Ubuntu 22.04',
      browser: 'Firefox',
      extra: 'Node.js 20, Python 3.11',
    },
    communicationPreference: 'Technical, code examples preferred',
    avatarColor: 'bg-emerald-500',
    createdAt: '2026-06-18',
  },
];

export const tickets: Ticket[] = [
  // Sarah
  {
    id: 'TKT-1001',
    customerId: 'CUS-1024',
    date: '2026-09-20',
    issue: 'Login failure — cannot sign into CloudDesk',
    status: 'resolved',
    resolution: 'Cleared CloudDesk session/cookies and signed in again',
    outcome: 'resolved',
    summary: 'Customer could not log in. Session/cookie clear fixed it.',
  },
  {
    id: 'TKT-1048',
    customerId: 'CUS-1024',
    date: '2026-09-25',
    issue: 'Login failure after product update',
    status: 'resolved',
    resolution: 'Cleared CloudDesk session/cookies; confirmed update-related recurrence',
    outcome: 'resolved',
    summary: 'Same login issue returned after update. Previous fix worked again.',
  },
  {
    id: 'TKT-1055',
    customerId: 'CUS-1024',
    date: '2026-09-10',
    issue: 'Notification settings not saving',
    status: 'resolved',
    resolution: 'Reset notification preferences in account settings',
    outcome: 'resolved',
  },
  // David
  {
    id: 'TKT-2010',
    customerId: 'CUS-2048',
    date: '2026-09-15',
    issue: 'Subscription renewal failed — payment declined',
    status: 'resolved',
    resolution: 'Updated card on file and retried payment',
    outcome: 'resolved',
    summary: 'Payment method expired. Updated card fixed renewal.',
  },
  {
    id: 'TKT-2022',
    customerId: 'CUS-2048',
    date: '2026-09-22',
    issue: 'Invoice not received for September',
    status: 'resolved',
    resolution: 'Resent invoice to david.miller@techflow.io',
    outcome: 'resolved',
  },
  {
    id: 'TKT-2030',
    customerId: 'CUS-2048',
    date: '2026-08-28',
    issue: 'Seat count mismatch after adding team members',
    status: 'resolved',
    resolution: 'Synced license count with billing; added 3 seats',
    outcome: 'resolved',
  },
  // Emily
  {
    id: 'TKT-3005',
    customerId: 'CUS-3072',
    date: '2026-09-12',
    issue: 'API 401 on /v2/workspaces endpoint',
    status: 'resolved',
    resolution: 'Rotated API key and updated Authorization header format',
    outcome: 'resolved',
    summary: 'Invalid API key after rotation. New key + Bearer format fixed it.',
  },
  {
    id: 'TKT-3018',
    customerId: 'CUS-3072',
    date: '2026-09-18',
    issue: 'Webhook delivery timeouts',
    status: 'resolved',
    resolution: 'Increased webhook timeout to 15s and added retry logic guidance',
    outcome: 'resolved',
  },
  {
    id: 'TKT-3025',
    customerId: 'CUS-3072',
    date: '2026-09-05',
    issue: 'Rate limit errors on bulk import',
    status: 'resolved',
    resolution: 'Recommended batch size of 50 and exponential backoff',
    outcome: 'resolved',
  },
  {
    id: 'TKT-3031',
    customerId: 'CUS-3072',
    date: '2026-08-20',
    issue: 'SDK type mismatch with TypeScript 5.4',
    status: 'resolved',
    resolution: 'Upgraded to CloudDesk SDK 3.2.1',
    outcome: 'resolved',
  },
];

export const memories: MemoryItem[] = [
  // Sarah Johnson — core demo memories
  {
    id: 'mem-s1',
    customerId: 'CUS-1024',
    type: 'product',
    content: 'Uses CloudDesk Pro on company account',
    confidence: 'remembered',
    date: '2026-08-12',
  },
  {
    id: 'mem-s2',
    customerId: 'CUS-1024',
    type: 'environment',
    content: 'Environment: Windows 11 + Chrome',
    confidence: 'remembered',
    date: '2026-09-20',
  },
  {
    id: 'mem-s3',
    customerId: 'CUS-1024',
    type: 'issue',
    content: 'Login failure — cannot sign into CloudDesk',
    confidence: 'remembered',
    date: '2026-09-20',
    source: 'TKT-1001',
  },
  {
    id: 'mem-s4',
    customerId: 'CUS-1024',
    type: 'successful_solution',
    content: 'Clearing CloudDesk session/cookies and signing in again resolved login failure',
    confidence: 'previously_successful',
    date: '2026-09-20',
    source: 'TKT-1001',
  },
  {
    id: 'mem-s5',
    customerId: 'CUS-1024',
    type: 'failed_solution',
    content: 'Restarting browser alone did not fix login issue',
    confidence: 'remembered',
    date: '2026-09-20',
  },
  {
    id: 'mem-s6',
    customerId: 'CUS-1024',
    type: 'recurring_pattern',
    content: 'Recurring login problem — appears after product updates',
    confidence: 'recently_observed',
    date: '2026-09-25',
    source: 'TKT-1048',
  },
  {
    id: 'mem-s7',
    customerId: 'CUS-1024',
    type: 'successful_solution',
    content: 'Clearing CloudDesk session/cookies worked again after update-related login failure',
    confidence: 'previously_successful',
    date: '2026-09-25',
    source: 'TKT-1048',
  },
  {
    id: 'mem-s8',
    customerId: 'CUS-1024',
    type: 'preference',
    content: 'Prefers concise technical instructions',
    confidence: 'remembered',
    date: '2026-09-10',
  },
  {
    id: 'mem-s9',
    customerId: 'CUS-1024',
    type: 'sentiment',
    content: 'Showed frustration during repeated login issues',
    confidence: 'recently_observed',
    date: '2026-09-25',
  },
  {
    id: 'mem-s10',
    customerId: 'CUS-1024',
    type: 'timeline',
    content: 'Sep 20: Login issue discovered and resolved via cookie/session clear',
    confidence: 'remembered',
    date: '2026-09-20',
  },
  {
    id: 'mem-s11',
    customerId: 'CUS-1024',
    type: 'timeline',
    content: 'Sep 25: Login issue returned after update; same fix applied',
    confidence: 'remembered',
    date: '2026-09-25',
  },

  // David Miller
  {
    id: 'mem-d1',
    customerId: 'CUS-2048',
    type: 'product',
    content: 'Uses CloudDesk Pro on TechFlow company account',
    confidence: 'remembered',
    date: '2026-07-03',
  },
  {
    id: 'mem-d2',
    customerId: 'CUS-2048',
    type: 'environment',
    content: 'Environment: macOS Sonoma + Safari',
    confidence: 'remembered',
    date: '2026-09-15',
  },
  {
    id: 'mem-d3',
    customerId: 'CUS-2048',
    type: 'issue',
    content: 'Subscription renewal failed due to declined payment',
    confidence: 'remembered',
    date: '2026-09-15',
    source: 'TKT-2010',
  },
  {
    id: 'mem-d4',
    customerId: 'CUS-2048',
    type: 'successful_solution',
    content: 'Updating card on file and retrying payment resolved renewal failure',
    confidence: 'previously_successful',
    date: '2026-09-15',
    source: 'TKT-2010',
  },
  {
    id: 'mem-d5',
    customerId: 'CUS-2048',
    type: 'preference',
    content: 'Prefers step-by-step instructions with screenshots when possible',
    confidence: 'remembered',
    date: '2026-09-15',
  },
  {
    id: 'mem-d6',
    customerId: 'CUS-2048',
    type: 'account',
    content: 'Billing email: david.miller@techflow.io;  team seats managed by admin',
    confidence: 'remembered',
    date: '2026-09-22',
  },

  // Emily Chen
  {
    id: 'mem-e1',
    customerId: 'CUS-3072',
    type: 'product',
    content: 'Uses CloudDesk API (integration-focused)',
    confidence: 'remembered',
    date: '2026-06-18',
  },
  {
    id: 'mem-e2',
    customerId: 'CUS-3072',
    type: 'environment',
    content: 'Environment: Ubuntu 22.04, Firefox, Node.js 20, Python 3.11',
    confidence: 'remembered',
    date: '2026-09-12',
  },
  {
    id: 'mem-e3',
    customerId: 'CUS-3072',
    type: 'issue',
    content: 'API 401 on /v2/workspaces — invalid or rotated API key',
    confidence: 'remembered',
    date: '2026-09-12',
    source: 'TKT-3005',
  },
  {
    id: 'mem-e4',
    customerId: 'CUS-3072',
    type: 'successful_solution',
    content: 'Rotating API key and using Authorization: Bearer <key> fixed 401 errors',
    confidence: 'previously_successful',
    date: '2026-09-12',
    source: 'TKT-3005',
  },
  {
    id: 'mem-e5',
    customerId: 'CUS-3072',
    type: 'successful_solution',
    content: 'For bulk imports: use batch size 50 with exponential backoff to avoid rate limits',
    confidence: 'previously_successful',
    date: '2026-09-05',
    source: 'TKT-3025',
  },
  {
    id: 'mem-e6',
    customerId: 'CUS-3072',
    type: 'preference',
    content: 'Prefers technical responses with code examples',
    confidence: 'remembered',
    date: '2026-09-12',
  },
  {
    id: 'mem-e7',
    customerId: 'CUS-3072',
    type: 'recurring_pattern',
    content: 'Occasionally hits rate limits during large data migrations',
    confidence: 'recently_observed',
    date: '2026-09-05',
  },
];

export const dashboardStats: DashboardStats = {
  customers: 128,
  conversations: 1284,
  memoriesStored: 4892,
  memoryAssistedResolutions: 73,
};

/** In-memory store that starts from seed and can be mutated at runtime (server-side). */
let runtimeCustomers = [...customers];
let runtimeTickets = [...tickets];
let runtimeMemories = [...memories];

export function getCustomers() {
  return runtimeCustomers;
}

export function getCustomer(id: string) {
  return runtimeCustomers.find((c) => c.id === id);
}

export function getTicketsForCustomer(customerId: string) {
  return runtimeTickets
    .filter((t) => t.customerId === customerId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getMemoriesForCustomer(customerId: string) {
  return runtimeMemories
    .filter((m) => m.customerId === customerId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function addMemory(memory: MemoryItem) {
  runtimeMemories = [memory, ...runtimeMemories.filter((m) => m.id !== memory.id)];
  return memory;
}

export function addTicket(ticket: Ticket) {
  runtimeTickets = [ticket, ...runtimeTickets];
  return ticket;
}

export function searchCustomers(q: string) {
  const query = q.toLowerCase().trim();
  if (!query) return runtimeCustomers;
  return runtimeCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query) ||
      c.product.toLowerCase().includes(query) ||
      (c.company || '').toLowerCase().includes(query)
  );
}

export function getCustomerProfile(customerId: string) {
  const customer = getCustomer(customerId);
  if (!customer) return null;
  const mems = getMemoriesForCustomer(customerId);
  const tix = getTicketsForCustomer(customerId);
  return {
    customer,
    memories: mems,
    tickets: tix,
    successfulFixes: mems
      .filter((m) => m.type === 'successful_solution')
      .map((m) => m.content),
    failedSolutions: mems
      .filter((m) => m.type === 'failed_solution')
      .map((m) => m.content),
    knownIssues: mems
      .filter((m) => m.type === 'issue' || m.type === 'recurring_pattern')
      .map((m) => m.content),
    timeline: mems
      .filter((m) => m.type === 'timeline')
      .map((m) => ({ date: m.date, event: m.content })),
  };
}
