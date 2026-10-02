import { z } from 'zod';
import { IPracticeService } from '@/domain/practice/IPracticeService';
import {
  AgentCode,
  AgentPersona,
  ConversationMessage,
  CreatedPracticeSession,
  PracticeCategory,
  PracticeSession,
  PracticeSessionListItem,
} from '@/domain/practice/practice.types';
import { HttpTransport, decode } from '@/core/network/HttpTransport';
import {
  agentPersonaResponseSchema,
  createSessionResponseSchema,
  messageResponseSchema,
  practiceCategoryResponseSchema,
  sessionListItemResponseSchema,
  sessionResponseSchema,
} from './dto/domain.dto';

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
    text?: string;
    modality?: string;
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
      text: data.text,
      modality: data.modality,
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
  }): Promise<ConversationMessage> {
    const data = decode(
      messageResponseSchema,
      await this.http.request({
        method: 'POST',
        path: `/practice/sessions/${input.sessionId}/messages`,
        body: { text: input.text, client_message_id: input.clientMessageId },
      }),
    );
    return this.mapMessage(data);
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
