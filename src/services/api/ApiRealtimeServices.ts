import { z } from 'zod';
import { ICallService, IPodcastService } from '@/domain/realtime/IRealtimeServices';
import {
  CallEndReason,
  CallMode,
  CallSession,
  CallSessionListItem,
  Podcast,
  PodcastSource,
} from '@/domain/realtime/realtime.types';
import { AgentCode } from '@/domain/practice/practice.types';
import { HttpTransport, decode } from '@/core/network/HttpTransport';
import {
  callListItemResponseSchema,
  callResponseSchema,
  joinTokenResponseSchema,
  podcastResponseSchema,
  podcastSourceResponseSchema,
} from './dto/domain.dto';

export class ApiCallService implements ICallService {
  constructor(private readonly http: HttpTransport) {}

  private mapCall(data: {
    session_id: string;
    mode: string;
    state: string;
    room_name: string;
    end_reason: string | null;
  }): CallSession {
    return {
      sessionId: data.session_id,
      mode: data.mode,
      state: data.state,
      roomName: data.room_name,
      endReason: data.end_reason,
    };
  }

  public async createCall(input: {
    mode: CallMode;
    agentCode: AgentCode;
    consentVersion: string;
  }): Promise<CallSession> {
    const data = decode(
      callResponseSchema,
      await this.http.request({
        method: 'POST',
        path: '/calls',
        body: {
          mode: input.mode,
          agent_code: input.agentCode,
          consent_version: input.consentVersion,
        },
      }),
    );
    return this.mapCall(data);
  }

  public async getCall(sessionId: string): Promise<CallSession> {
    const data = decode(
      callResponseSchema,
      await this.http.request({ method: 'GET', path: `/calls/${sessionId}` }),
    );
    return this.mapCall(data);
  }

  public async getJoinToken(sessionId: string): Promise<string> {
    const data = decode(
      joinTokenResponseSchema,
      await this.http.request({
        method: 'POST',
        path: `/calls/${sessionId}:join-token`,
        body: {},
      }),
    );
    return data.join_token;
  }

  public async endCall(sessionId: string, endReason: CallEndReason): Promise<CallSession> {
    const data = decode(
      callResponseSchema,
      await this.http.request({
        method: 'POST',
        path: `/calls/${sessionId}:end`,
        body: { end_reason: endReason },
      }),
    );
    return this.mapCall(data);
  }

  public async listCalls(input?: { state?: string; limit?: number }): Promise<CallSessionListItem[]> {
    const params = new URLSearchParams();
    if (input?.state) params.set('state', input.state);
    if (input?.limit) params.set('limit', String(input.limit));
    const qs = params.toString();
    const data = decode(
      z.array(callListItemResponseSchema),
      await this.http.request({
        method: 'GET',
        path: `/calls${qs ? `?${qs}` : ''}`,
      }),
    );
    return data.map((c) => ({
      sessionId: c.session_id,
      mode: c.mode,
      state: c.state,
      agentCode: c.agent_code,
      agentDisplayName: c.agent_display_name,
      agentProfileImageUrl: c.agent_profile_image_url,
      startedAt: c.started_at,
      endedAt: c.ended_at,
      durationSeconds: c.duration_seconds,
    }));
  }
}

export class ApiPodcastService implements IPodcastService {
  constructor(private readonly http: HttpTransport) {}

  public async createPodcast(title: string): Promise<Podcast> {
    const data = decode(
      podcastResponseSchema,
      await this.http.request({ method: 'POST', path: '/podcasts', body: { title } }),
    );
    return { podcastId: data.podcast_id, title: data.title, state: data.state };
  }

  public async addSource(podcastId: string, mediaId: string): Promise<PodcastSource> {
    const data = decode(
      podcastSourceResponseSchema,
      await this.http.request({
        method: 'POST',
        path: `/podcasts/${podcastId}/sources`,
        body: { media_id: mediaId },
      }),
    );
    return {
      sourceVersionId: data.source_version_id,
      revision: data.revision,
      parseStatus: data.parse_status,
    };
  }
}
