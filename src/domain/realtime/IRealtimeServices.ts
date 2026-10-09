import { CallEndReason, CallMode, CallSession, CallSessionListItem, Podcast, PodcastIngestionStatus, PodcastListItem, PodcastPlayback, PodcastSource } from './realtime.types';
import { AgentCode } from '../practice/practice.types';

export interface ICallService {
  createCall(input: {
    mode: CallMode;
    agentCode: AgentCode;
    consentVersion: string;
  }): Promise<CallSession>;
  getCall(sessionId: string): Promise<CallSession>;
  /** Throws FeatureUnavailable until backend realtime admission is enabled. */
  getJoinToken(sessionId: string): Promise<string>;
  endCall(sessionId: string, endReason: CallEndReason): Promise<CallSession>;
  listCalls(input?: { state?: string; limit?: number }): Promise<CallSessionListItem[]>;
}

export interface IPodcastService {
  createPodcast(title: string): Promise<Podcast>;
  listPodcasts(input?: { limit?: number }): Promise<PodcastListItem[]>;
  addSource(podcastId: string, mediaId: string): Promise<PodcastSource>;
  /** Poll status ingestion dokumen sampai parseStatus 'parsed' | 'failed'. */
  getIngestionStatus(podcastId: string): Promise<PodcastIngestionStatus>;
  /**
   * Play podcast: backend generate script baru via Langflow (sync) lalu
   * membuat playback + session baru. 1 klik play = 1 script version baru.
   */
  play(podcastId: string, targetDurationSeconds: number): Promise<PodcastPlayback>;
}
