import { CallEndReason, CallMode, CallSession, Podcast, PodcastSource } from './realtime.types';
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
}

export interface IPodcastService {
  createPodcast(title: string): Promise<Podcast>;
  addSource(podcastId: string, mediaId: string): Promise<PodcastSource>;
}
