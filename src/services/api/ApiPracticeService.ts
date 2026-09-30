import { z } from 'zod';
import { IPracticeService } from '@/domain/practice/IPracticeService';
import {
  AgentCode,
  AgentPersona,
  ConversationMessage,
  PracticeCategory,
  PracticeSession,
} from '@/domain/practice/practice.types';
import { HttpTransport, decode } from '@/core/network/HttpTransport';
import {
  agentPersonaResponseSchema,
  messageResponseSchema,
  practiceCategoryResponseSchema,
  sessionResponseSchema,
} from './dto/domain.dto';

export class ApiPracticeService implements IPracticeService {
  constructor(private readonly http: HttpTransport) {}

  private mapSession(data: {
    session_id: string;
    kind: string;
    state: string;
    started_at: string;
  }): PracticeSession {
    return {
      sessionId: data.session_id,
      kind: data.kind,
      state: data.state,
      startedAt: data.started_at,
    };
  }

  private mapMessage(data: {
    message_id: string;
    session_id: string;
    role: string;
    sequence: number;
    terminal_state: string;
    created_at: string;
  }): ConversationMessage {
    return {
      messageId: data.message_id,
      sessionId: data.session_id,
      role: data.role,
      sequence: data.sequence,
      terminalState: data.terminal_state,
      createdAt: data.created_at,
    };
  }

  public async createSession(input: {
    agentCode: AgentCode;
    categoryId: string;
  }): Promise<PracticeSession> {
    const data = decode(
      sessionResponseSchema,
      await this.http.request({
        method: 'POST',
        path: '/practice/sessions',
        body: { agent_code: input.agentCode, category_id: input.categoryId },
      }),
    );
    return this.mapSession(data);
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
        path: `/plans/agents?limit=${limit}`,
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
}
