import {
  AgentCode,
  AgentPersona,
  ChatTurnResult,
  ConversationMessage,
  CreatedPracticeSession,
  PracticeCategory,
  PracticeSession,
  PracticeSessionListItem,
  ReplySuggestions,
} from './practice.types';
import {
  SseCompletedData,
  SseFailedData,
  SseStartedData,
  SseTextDeltaData,
  SseTranscriptData,
  SseUsageData,
  SseStreamHandle,
} from '@/core/network/sseClient';

/**
 * SSE Streaming callbacks for chat operations
 */
export interface PracticeStreamCallbacks {
  readonly onStarted?: (data: SseStartedData) => void;
  readonly onTranscript?: (data: SseTranscriptData) => void;
  readonly onTextDelta?: (data: SseTextDeltaData) => void;
  readonly onUsageUpdated?: (data: SseUsageData) => void;
  readonly onCompleted?: (data: SseCompletedData) => void;
  readonly onFailed?: (data: SseFailedData) => void;
  readonly onError?: (error: Error) => void;
}

export interface IPracticeService {
  /** Buat session baru; backend memanggil workflow Langflow untuk chat pertama AI. */
  createSession(input: { agentCode: AgentCode; categoryId: string }): Promise<CreatedPracticeSession>;
  /**
   * Buat session baru dengan SSE streaming untuk greeting message.
   * Text greeting tersedia lebih cepat (~detik 39), audio TTS menyusul (~detik 45).
   * first_message bisa null jika greeting gagal (best-effort).
   */
  createSessionStream(
    input: { agentCode: AgentCode; categoryId: string },
    callbacks: PracticeStreamCallbacks,
  ): SseStreamHandle;
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
  }): Promise<ChatTurnResult>;
  /**
   * Kirim text message dengan SSE streaming.
   * Response text tersedia lebih cepat (~detik 39), audio TTS menyusul (~detik 45).
   */
  sendMessageStream(
    input: {
      sessionId: string;
      text: string;
      clientMessageId: string;
    },
    callbacks: PracticeStreamCallbacks,
  ): SseStreamHandle;
  listMessages(sessionId: string, limit?: number): Promise<ConversationMessage[]>;
  /**
   * Reply suggestions untuk session: 3 opsi kalimat yang digenerate backend
   * sebagai panduan dibaca user saat merekam voice message (bukan untuk
   * dikirim langsung sebagai chat bubble).
   */
  getSuggestions(sessionId: string): Promise<ReplySuggestions>;
  /** Voice note: media audio sudah finalized; Langflow melakukan STT+TTS. */
  sendVoiceMessage(input: {
    sessionId: string;
    mediaId: string;
    text?: string | null;
    audioDurationMs?: number | null;
    clientMessageId: string;
  }): Promise<ChatTurnResult>;
  /**
   * Kirim voice message dengan SSE streaming.
   * Transcript tersedia ~detik 14, response text ~detik 39, audio ~detik 45.
   *
   * Flow 3-hit: client mengirim `text` (hasil transcribe via
   * POST /media/{id}:transcribe) dan `audioDurationMs` (dari recorder) agar
   * backend menyimpan durasi akurat dan tidak perlu STT ulang.
   */
  sendVoiceMessageStream(
    input: {
      sessionId: string;
      mediaId: string;
      text?: string | null;
      audioDurationMs?: number | null;
      clientMessageId: string;
    },
    callbacks: PracticeStreamCallbacks,
  ): SseStreamHandle;
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
