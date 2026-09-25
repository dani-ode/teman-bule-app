/**
 * Practice (chat) domain. Message lifecycle: local pending → persisted.
 * client_message_id is stable across retries of the same logical message.
 */

export type AgentCode = 'elean' | 'willy';

export interface PracticeSession {
  readonly sessionId: string;
  readonly kind: string;
  readonly state: string;
  readonly startedAt: string;
}

export interface ConversationMessage {
  readonly messageId: string;
  readonly sessionId: string;
  readonly role: string;
  readonly sequence: number;
  readonly terminalState: string;
  readonly createdAt: string;
  /** Present only for locally-pending messages. */
  readonly localText?: string;
  readonly pending?: boolean;
  readonly failed?: boolean;
}
