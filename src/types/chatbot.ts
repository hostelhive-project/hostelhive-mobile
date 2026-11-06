export type ChatSender = 'User' | 'Bot';

export interface ChatMessage {
  _id?: string;
  userId?: string;
  sessionId: string;
  hostelId?: string | null;
  sender: ChatSender;
  message: string;
  createdAt?: string;
}

export interface SendMessagePayload {
  message: string;
  sessionId?: string;
  hostelId?: string;
}

export interface SendMessageResponse {
  sessionId: string;
  reply: string;
}

export interface ChatSessionSummary {
  _id: string; // sessionId
  lastMessage: string;
  lastMessageAt: string;
}

