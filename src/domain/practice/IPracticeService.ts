import {
  AgentCode,
  AgentPersona,
  ConversationMessage,
  PracticeCategory,
  PracticeSession,
} from './practice.types';

export interface IPracticeService {
  createSession(input: { agentCode: AgentCode; categoryId: string }): Promise<PracticeSession>;
  getSession(sessionId: string): Promise<PracticeSession>;
  /** Kategori practice published dari backend (publik). */
  listCategories(limit?: number): Promise<PracticeCategory[]>;
  /** Persona agent TTS aktif (elean/willy) beserta foto profil. */
  listAgentPersonas(limit?: number): Promise<AgentPersona[]>;
  /** client_message_id preserves identity across retry. */
  sendMessage(input: {
    sessionId: string;
    text: string;
    clientMessageId: string;
  }): Promise<ConversationMessage>;
  listMessages(sessionId: string, limit?: number): Promise<ConversationMessage[]>;
  completeSession(sessionId: string): Promise<PracticeSession>;
}
