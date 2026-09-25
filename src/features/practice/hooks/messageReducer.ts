import { ConversationMessage } from '@/domain/practice/practice.types';
import { PendingMessage } from './usePractice';

/**
 * Pure message-merge reducer: combines persisted messages with locally
 * pending ones, ordered by creation time. Pending messages keep their local
 * identity (client_message_id) so a successful send replaces the pending
 * entry rather than duplicating it; a failed send marks it for explicit retry.
 */
export type MergedMessage = ConversationMessage | PendingMessage;

export const isPendingMessage = (m: MergedMessage): m is PendingMessage =>
  'pending' in m && m.pending === true;

export const mergeMessages = (
  persisted: readonly ConversationMessage[],
  pending: readonly PendingMessage[],
): MergedMessage[] =>
  [...persisted, ...pending].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

/** Marks a pending message as failed (truthful send outcome; never silent). */
export const markPendingFailed = (
  pending: readonly PendingMessage[],
  localMessageId: string,
): PendingMessage[] =>
  pending.map((m) => (m.messageId === localMessageId ? { ...m, failed: true } : m));

/** Removes a pending message once the server has persisted it. */
export const dropPending = (
  pending: readonly PendingMessage[],
  localMessageId: string,
): PendingMessage[] => pending.filter((m) => m.messageId !== localMessageId);
