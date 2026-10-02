import {
  AgentCode,
  AgentPersona,
  ConversationMessage,
  CreatedPracticeSession,
  PracticeCategory,
  PracticeSession,
  PracticeSessionListItem,
} from './practice.types';

export interface IPracticeService {
  /** Buat session baru; backend memanggil workflow Langflow untuk chat pertama AI. */
  createSession(input: { agentCode: AgentCode; categoryId: string }): Promise<CreatedPracticeSession>;
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
  /** Daftar session chat milik user dengan filter. */
  listSessions(input?: {
    categoryId?: string;
    agentCode?: AgentCode;
    state?: 'active' | 'completed' | 'abandoned';
    limit?: number;
  }): Promise<PracticeSessionListItem[]>;
  /** Hapus session beserta seluruh pesan terkait. */
  deleteSession(sessionId: string): Promise<void>;
}
