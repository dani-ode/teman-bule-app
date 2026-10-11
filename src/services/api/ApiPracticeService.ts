import { z } from 'zod';
import { IPracticeService } from '@/domain/practice/IPracticeService';
import {
  AgentCode,
  AgentPersona,
  ChatTurnResult,
  ConversationMessage,
  CreatedPracticeSession,
  PracticeCategory,
  PracticeSession,
  PracticeSessionListItem,
} from '@/domain/practice/practice.types';
import { HttpTransport, decode } from '@/core/network/HttpTransport';
import {
  agentPersonaResponseSchema,
  chatTurnMessagesSchema,
  chatTurnResultSchema,
  createSessionResponseSchema,
  messageResponseSchema,
  practiceCategoryResponseSchema,
  sessionListItemResponseSchema,
  sessionResponseSchema,
} from './dto/domain.dto';

/** Wire ChatResult hasil decode `chatTurnResultSchema` (bentuk snake_case). */
type ChatTurnResultData = z.infer<typeof chatTurnResultSchema>;

/**
 * Timeout panjang untuk endpoint yang secara sinkron memanggil workflow
 * Langflow (LLM + STT/TTS). Di Postman call ini sukses karena tidak ada
 * client timeout; di app default timeout (15s) terlalu pendek.
 */
const LANGFLOW_TIMEOUT_MS = 120_000;

export class ApiPracticeService implements IPracticeService {
  constructor(private readonly http: HttpTransport) {}

  private mapSession(data: {
    session_id: string;
    kind: string;
    state: string;
    started_at: string;
    agent_code?: string | null;
    category_id?: string | null;
  }): PracticeSession {
    return {
      sessionId: data.session_id,
      kind: data.kind,
      state: data.state,
      startedAt: data.started_at,
      agentCode: data.agent_code ?? null,
      categoryId: data.category_id ?? null,
    };
  }

  private mapMessage(data: {
    message_id: string;
    session_id: string;
    role: string;
    sequence: number;
    terminal_state: string;
    created_at: string;
    text?: string | null;
    modality?: string | null;
    media_id?: string | null;
    audio_url?: string | null;
    audio_duration_ms?: number | null;
  }): ConversationMessage {
    return {
      messageId: data.message_id,
      sessionId: data.session_id,
      role: data.role,
      sequence: data.sequence,
      terminalState: data.terminal_state,
      createdAt: data.created_at,
      text: data.text ?? undefined,
      modality: data.modality ?? undefined,
      mediaId: data.media_id ?? null,
      audioUrl: data.audio_url ?? null,
      audioDurationMs: data.audio_duration_ms ?? null,
    };
  }

  public async createSession(input: {
    agentCode: AgentCode;
    categoryId: string;
  }): Promise<CreatedPracticeSession> {
    const data = decode(
      createSessionResponseSchema,
      await this.http.request({
        method: 'POST',
        path: '/practice/sessions',
        body: { agent_code: input.agentCode, category_id: input.categoryId },
        timeoutMs: LANGFLOW_TIMEOUT_MS,
      }),
    );
    return {
      sessionId: data.session_id,
      kind: data.kind,
      state: data.state,
      startedAt: data.started_at,
      agentCode: data.agent_code,
      categoryId: data.category_id,
      firstMessage: data.first_message ? this.mapMessage(data.first_message) : null,
    };
  }

  public async getSession(sessionId: string): Promise<PracticeSession> {
    const data = decode(
      sessionResponseSchema,
      await this.http.request({ method: 'GET', path: `/practice/sessions/${sessionId}` }),
    );
    return this.mapSession(data);
  }

  public async listCategories(limit = 50): Promise<PracticeCategory[]> {
    const data = decode(
      z.array(practiceCategoryResponseSchema),
      await this.http.request({
        method: 'GET',
        path: `/practice/categories?limit=${limit}`,
      }),
    );
    return data.map((c) => ({
      categoryId: c.category_id,
      code: c.code,
      title: c.title,
      description: c.description,
      imageUrl: c.image_url,
      sortOrder: c.sort_order,
    }));
  }

  public async listAgentPersonas(limit = 50): Promise<AgentPersona[]> {
    const data = decode(
      z.array(agentPersonaResponseSchema),
      await this.http.request({
        method: 'GET',
        path: `/me/agents?limit=${limit}`,
      }),
    );
    return data.map((a) => ({
      agentId: a.agent_id,
      code: a.code,
      displayName: a.display_name,
      profileImageUrl: a.profile_image_url,
    }));
  }

  public async sendMessage(input: {
    sessionId: string;
    text: string;
    clientMessageId: string;
  }): Promise<ChatTurnResult> {
    // Response bisa berupa ChatResult envelope Langflow (bentuk produksi saat
    // ini, sama seperti voice-messages), ATAU envelope chat-turn
    // { user_message, ai_message }, ATAU satu message (legacy) — dukung
    // semuanya agar AI reply langsung tampil tanpa menunggu refetch.
    const raw = await this.http.request({
      method: 'POST',
      path: `/practice/sessions/${input.sessionId}/messages`,
      body: { text: input.text, client_message_id: input.clientMessageId },
      timeoutMs: LANGFLOW_TIMEOUT_MS,
    });

    const asResult = chatTurnResultSchema.safeParse(raw);
    if (asResult.success) {
      return this.mapChatTurnResult(asResult.data);
    }

    const asTurn = chatTurnMessagesSchema.safeParse(raw);
    if (asTurn.success) {
      const userMsg = asTurn.data.user_message;
      const aiMsg = asTurn.data.ai_message;
      return {
        sessionId: userMsg.session_id,
        schemaVersion: '',
        requestId: '',
        status: 'ok',
        responseText: aiMsg?.text ?? '',
        audio: null,
        aiMessage: aiMsg ? this.mapMessage(aiMsg) : null,
        userMessage: this.mapMessage(userMsg),
      };
    }

    const single = decode(messageResponseSchema, raw);
    return {
      sessionId: single.session_id,
      schemaVersion: '',
      requestId: '',
      status: 'ok',
      responseText: single.text ?? '',
      audio: single.audio_url ? { url: single.audio_url } : null,
      aiMessage: single.role === 'agent' ? this.mapMessage(single) : null,
      userMessage: null,
    };
  }

  /**
   * Map ChatResult wire (Langflow via backend ChatService) ke domain
   * ChatTurnResult. Audio TTS dikirim top-level (audio_url,
   * audio_duration_ms); fallback ke `audio.url`/`audio.duration_ms` bila
   * backend membungkus dalam record `audio`.
   */
  private mapChatTurnResult(data: ChatTurnResultData): ChatTurnResult {
    const nestedUrl =
      data.audio && typeof data.audio.url === 'string'
        ? (data.audio.url as string)
        : null;
    const audioUrl = data.audio_url ?? nestedUrl;
    const nestedDuration =
      data.audio && typeof data.audio.duration_ms === 'number'
        ? (data.audio.duration_ms as number)
        : null;
    const audioDurationMs = data.audio_duration_ms ?? nestedDuration;
    return {
      sessionId: data.session_id,
      schemaVersion: data.schema_version,
      requestId: data.request_id,
      status: data.status,
      responseText: data.response_text,
      audio: data.audio ?? null,
      aiMessage: {
        // Pakai message_id server bila ada; jangan memalsukan ID korelasi.
        messageId: data.message_id ?? `ai-${data.request_id}`,
        sessionId: data.session_id,
        role: 'agent',
        sequence: -1,
        terminalState: 'final',
        createdAt: new Date().toISOString(),
        text: data.response_text,
        modality: audioUrl ? 'audio' : 'text',
        audioUrl,
        audioDurationMs,
      },
    };
  }

  public async sendVoiceMessage(input: {
    sessionId: string;
    mediaId: string;
    text?: string | null;
    clientMessageId: string;
  }): Promise<ChatTurnResult> {
    const data = decode(
      chatTurnResultSchema,
      await this.http.request({
        method: 'POST',
        path: `/practice/sessions/${input.sessionId}/voice-messages`,
        body: {
          media_id: input.mediaId,
          text: input.text ?? null,
          client_message_id: input.clientMessageId,
        },
        timeoutMs: LANGFLOW_TIMEOUT_MS,
      }),
    );
    return this.mapChatTurnResult(data);
  }

  public async listMessages(sessionId: string, limit = 50): Promise<ConversationMessage[]> {
    const data = decode(
      z.array(messageResponseSchema),
      await this.http.request({
        method: 'GET',
        path: `/practice/sessions/${sessionId}/messages?limit=${limit}`,
      }),
    );
    return data.map((m) => this.mapMessage(m));
  }

  public async completeSession(sessionId: string): Promise<PracticeSession> {
    const data = decode(
      sessionResponseSchema,
      await this.http.request({
        method: 'POST',
        path: `/practice/sessions/${sessionId}:complete`,
        body: {},
      }),
    );
    return this.mapSession(data);
  }

  public async listSessions(input?: {
    categoryId?: string;
    agentCode?: AgentCode;
    state?: 'active' | 'completed' | 'abandoned';
    limit?: number;
  }): Promise<PracticeSessionListItem[]> {
    const params = new URLSearchParams();
    if (input?.categoryId) params.append('category_id', input.categoryId);
    if (input?.agentCode) params.append('agent_code', input.agentCode);
    if (input?.state) params.append('state', input.state);
    if (input?.limit) params.append('limit', String(input.limit));
    const query = params.toString();
    const path = `/practice/sessions${query ? `?${query}` : ''}`;
    const data = decode(
      z.array(sessionListItemResponseSchema),
      await this.http.request({ method: 'GET', path }),
    );
    return data.map((s) => ({
      sessionId: s.session_id,
      kind: s.kind,
      state: s.state,
      categoryId: s.category_id,
      agentCode: s.agent_code,
      startedAt: s.started_at,
      endedAt: s.ended_at,
    }));
  }

  public async deleteSession(sessionId: string): Promise<void> {
    await this.http.request({
      method: 'DELETE',
      path: `/practice/sessions/${sessionId}`,
    });
  }
}
