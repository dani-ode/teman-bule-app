/**
 * Practice (chat) domain. Message lifecycle: local pending → persisted.
 * client_message_id is stable across retries of the same logical message.
 */

export type AgentCode = 'elean' | 'willy';

export interface PracticeSession {
  readonly sessionId: string;
  readonly kind: string;
  readonly state: string;
  readonly startedAt: string;
  readonly agentCode?: string | null;
  readonly categoryId?: string | null;
}

/**
 * Hasil pembuatan session baru: session + chat pertama dari AI yang
 * digenerate workflow Langflow (null jika greeting belum tersedia).
 */
export interface CreatedPracticeSession {
  readonly sessionId: string;
  readonly kind: string;
  readonly state: string;
  readonly startedAt: string;
  readonly agentCode: string;
  readonly categoryId: string;
  readonly firstMessage: ConversationMessage | null;
}

export interface PracticeSessionListItem {
  readonly sessionId: string;
  readonly kind: string;
  readonly state: string;
  readonly categoryId: string;
  readonly agentCode: string;
  readonly startedAt: string;
  readonly endedAt: string | null;
}

export interface PracticeCategory {
  readonly categoryId: string;
  readonly code: string;
  readonly title: string;
  readonly description: string | null;
  readonly imageUrl: string | null;
  readonly sortOrder: number;
}

export interface AgentPersona {
  readonly agentId: string;
  readonly code: string;
  readonly displayName: string;
  readonly profileImageUrl: string | null;
}

export interface ConversationMessage {
  readonly messageId: string;
  readonly sessionId: string;
  readonly role: string;
  readonly sequence: number;
  readonly terminalState: string;
  readonly createdAt: string;
  /** Message text (greeting dari AI / local pending). */
  readonly text?: string;
  /** 'audio' bila pesan membawa audio (chat mostly audio). */
  readonly modality?: string;
  /** URL audio S3/MinIO dari workflow (TTS). */
  readonly audioUrl?: string | null;
  readonly audioDurationMs?: number | null;
  /** Present only for locally-pending messages. */
  readonly localText?: string;
  readonly pending?: boolean;
  readonly failed?: boolean;
}
