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
  /** Link media_objects untuk audio terdaftar (voice message user). */
  readonly mediaId?: string | null;
  /** URL audio S3/MinIO dari workflow (TTS). */
  readonly audioUrl?: string | null;
  readonly audioDurationMs?: number | null;
  /** Local URI hasil rekaman (hanya untuk optimistic voice message user). */
  readonly localAudioUri?: string;
  /** Present only for locally-pending messages. */
  readonly localText?: string;
  readonly pending?: boolean;
  readonly failed?: boolean;
}

/**
 * Hasil reply suggestions untuk satu session. Opsi kalimat (biasanya 3) yang
 * bisa dibaca user sebagai panduan saat merekam voice message — bukan untuk
 * dikirim langsung sebagai bubble chat.
 */
export interface ReplySuggestions {
  readonly sessionId: string;
  readonly suggestions: ReadonlyArray<string>;
}

/**
 * Hasil satu chat turn (text/voice) yang diproses Langflow via backend.
 * audio membawa metadata TTS (mis. URL audio S3/MinIO) bila ada.
 */
export interface ChatTurnResult {
  readonly sessionId: string;
  readonly schemaVersion: string;
  readonly requestId: string;
  readonly status: string;
  readonly responseText: string;
  readonly audio?: Record<string, unknown> | null;
  /** AI reply yang sudah dipersist; langsung render tanpa refetch. */
  readonly aiMessage?: ConversationMessage | null;
  /** Pesan user yang sudah dipersist (bila dikirim server pada respons). */
  readonly userMessage?: ConversationMessage | null;
}
