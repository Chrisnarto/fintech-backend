export interface ChatMessage {
  id: string;
  chatId: string;
  sender: 'user' | 'ai' | 'agent';
  message: string;
  timestamp: Date;
  metadata?: any;
}

export interface ChatSession {
  id: string;
  userId: string;
  type: 'ai' | 'human';
  status: 'active' | 'closed';
  agentId?: string;
  startedAt: Date;
  closedAt?: Date;
}

export interface AgentInfo {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  specialization?: string;
}

