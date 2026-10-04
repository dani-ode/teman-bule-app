/**
 * Call & podcast domain. Realtime adapters are gated by backend feature
 * readiness; UI surfaces explicit unavailable states (never silent fallback).
 */

export type CallMode = 'voice' | 'video';

/** Backend-authoritative end reasons (calls services VALID_END_REASONS). */
export type CallEndReason =
  | 'user_hangup'
  | 'agent_completed'
  | 'low_balance'
  | 'balance_exhausted'
  | 'error'
  | 'timeout'
  | 'admin';

export interface CallSession {
  readonly sessionId: string;
  readonly mode: string;
  readonly state: string;
  readonly roomName: string;
  readonly endReason: string | null;
}

export interface CallSessionListItem {
  readonly sessionId: string;
  readonly mode: string;
  readonly state: string;
  readonly agentCode: string;
  readonly agentDisplayName: string;
  readonly agentProfileImageUrl: string | null;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly durationSeconds: number | null;
}

/** Assessment categories for call evaluation. */
export interface CallAssessment {
  readonly sessionId: string;
  readonly pronunciation: number | null;
  readonly grammar: number | null;
  readonly fluency: number | null;
  readonly vocabulary: number | null;
  readonly comprehension: number | null;
  readonly overallScore: number | null;
  readonly feedback: string | null;
}

export interface Podcast {
  readonly podcastId: string;
  readonly title: string;
  readonly state: string;
}

export interface PodcastSource {
  readonly sourceVersionId: string;
  readonly revision: number;
  readonly parseStatus: string;
}
