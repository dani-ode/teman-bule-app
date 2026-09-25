import { z } from 'zod';
import { IPracticeService } from '@/domain/practice/IPracticeService';
import {
  AgentCode,
  ConversationMessage,
  PracticeSession,
} from '@/domain/practice/practice.types';
import { HttpTransport, decode } from '@/core/network/HttpTransport';
import { messageResponseSchema, sessionResponseSchema } from './dto/domain.dto';

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
