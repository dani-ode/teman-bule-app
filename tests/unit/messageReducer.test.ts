import { describe, it, expect } from 'vitest';
import {
  mergeMessages,
  markPendingFailed,
  dropPending,
  isPendingMessage,
} from '@/features/practice/hooks/messageReducer';
import { ConversationMessage } from '@/domain/practice/practice.types';
import { PendingMessage } from '@/features/practice/hooks/usePractice';

const persisted = (id: string, createdAt: string): ConversationMessage => ({
  messageId: id,
  sessionId: 's1',
  role: 'user',
  sequence: 1,
  terminalState: 'completed',
  createdAt,
});

const pending = (id: string, createdAt: string, failed = false): PendingMessage => ({
  messageId: id,
  sessionId: 's1',
  role: 'user',
  sequence: -1,
  terminalState: 'pending',
  createdAt,
  localText: 'teks',
  pending: true,
  failed,
});

describe('message reducer', () => {
  it('merges persisted and pending ordered by creation time', () => {
    const merged = mergeMessages(
      [persisted('a', '2026-09-25T10:00:02Z')],
      [pending('b', '2026-09-25T10:00:01Z')],
    );
    expect(merged.map((m) => m.messageId)).toEqual(['b', 'a']);
  });

  it('marks a pending message failed without mutating others', () => {
    const list = [pending('x', '2026-09-25T10:00:00Z'), pending('y', '2026-09-25T10:00:01Z')];
    const result = markPendingFailed(list, 'x');
    expect(result[0].failed).toBe(true);
    expect(result[1].failed).toBe(false);
    expect(list[0].failed).toBe(false); // immutability preserved
  });

  it('drops a pending message after server persistence (no duplicate)', () => {
    const list = [pending('x', '2026-09-25T10:00:00Z')];
    expect(dropPending(list, 'x')).toHaveLength(0);
  });

  it('isPendingMessage narrows the union', () => {
    const p = pending('x', '2026-09-25T10:00:00Z');
    expect(isPendingMessage(p)).toBe(true);
    expect(isPendingMessage(persisted('a', '2026-09-25T10:00:00Z'))).toBe(false);
  });
});
