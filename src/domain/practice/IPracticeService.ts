import {
  AgentCode,
  ConversationMessage,
  PracticeSession,
} from './practice.types';

export interface IPracticeService {
  createSession(input: { agentCode: AgentCode; categoryId: string }): Promise<PracticeSession>;
  getSession(sessionId: string): Promise<PracticeSession>;
  /** client_message_id preserves identity across retry. */
  sendMessage(input: {
    sessionId: string;
    text: string;
    clientMessageId: string;
  }): Promise<ConversationMessage>;
  listMessages(sessionId: string, limit?: number): Promise<ConversationMessage[]>;
  completeSession(sessionId: string): Promise<PracticeSession>;
}
