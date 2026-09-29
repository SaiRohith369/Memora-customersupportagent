export type MemoryType =
  | 'issue'
  | 'successful_solution'
  | 'failed_solution'
  | 'environment'
  | 'preference'
  | 'sentiment'
  | 'recurring_pattern'
  | 'product'
  | 'account'
  | 'timeline'
  | 'other';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Customer {
  id: string;
  name: string;
  email: string;
  company?: string;
  product: string;
  environment: {
    os: string;
    browser: string;
    extra?: string;
  };
  communicationPreference: string;
  avatarColor: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  customerId: string;
  date: string;
  issue: string;
  status: TicketStatus;
  resolution?: string;
  outcome?: string;
  summary?: string;
}

export interface MemoryItem {
  id: string;
  customerId: string;
  type: MemoryType;
  content: string;
  source?: string;
  confidence?: 'remembered' | 'recently_observed' | 'previously_successful' | 'potentially_outdated';
  date: string;
  metadata?: Record<string, string>;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  memoriesUsed?: string[];
  memoryUpdated?: boolean;
  activity?: string;
}

export interface MemoryCandidate {
  type: MemoryType;
  content: string;
  confidence?: MemoryItem['confidence'];
}

export interface SupportResponse {
  response: string;
  memoryCandidates: MemoryCandidate[];
  memoriesUsed: string[];
  activity: string;
}

export interface CustomerProfile {
  customer: Customer;
  memories: MemoryItem[];
  tickets: Ticket[];
  successfulFixes: string[];
  failedSolutions: string[];
  knownIssues: string[];
  timeline: { date: string; event: string }[];
}

export interface ChatRequest {
  customerId: string;
  message: string;
  memoryEnabled?: boolean;
  conversationHistory?: ConversationMessage[];
}

export interface ChatResponse {
  reply: string;
  memoriesUsed: string[];
  memoryUpdated: boolean;
  activity: string;
  newMemories?: MemoryItem[];
  ticketCreated?: Ticket;
}

export interface DashboardStats {
  customers: number;
  conversations: number;
  memoriesStored: number;
  memoryAssistedResolutions: number;
}
