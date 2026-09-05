/**
 * Chat & AI Tutor Domain Types
 */

export type MessageSender = 'user' | 'ai_tutor';

export interface GrammarCorrection {
  readonly originalText: string;
  readonly correctedText: string;
  readonly explanation: string;
  readonly grammarPoint: string;
}

export interface ChatMessage {
  readonly id: string;
  readonly sessionId: string;
  readonly sender: MessageSender;
  readonly text: string;
  readonly timestamp: string;
  readonly correction?: GrammarCorrection;
}

export interface SendMessagePayload {
  readonly sessionId: string;
  readonly text: string;
}

export interface ChatSession {
  readonly sessionId: string;
  readonly topicTitle: string;
  readonly createdAt: string;
  readonly lastMessageAt: string;
  readonly messageCount: number;
}
