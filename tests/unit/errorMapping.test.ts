import { describe, it, expect } from 'vitest';
import { wireErrorEnvelopeSchema } from '@/core/types/wire.types';
import { userMessageForError } from '@/core/errors/errorMessage';
import { ClientError } from '@/core/errors/ClientError';

describe('wire error envelope', () => {
  it('decodes the canonical backend envelope with details array', () => {
    const payload = {
      error: {
        code: 'INSUFFICIENT_TOKENS',
        message: 'Saldo token tidak cukup.',
        request_id: 'req_123',
        details: [],
      },
    };
    const parsed = wireErrorEnvelopeSchema.parse(payload);
    expect(parsed.error.code).toBe('INSUFFICIENT_TOKENS');
    expect(parsed.error.request_id).toBe('req_123');
    expect(parsed.error.details).toEqual([]);
  });

  it('rejects a malformed envelope (missing request_id)', () => {
    const bad = { error: { code: 'X', message: 'm', details: [] } };
    expect(wireErrorEnvelopeSchema.safeParse(bad).success).toBe(false);
  });
});

describe('userMessageForError', () => {
  it('preserves server message and request_id from ClientError', () => {
    const err = new ClientError({
      kind: 'insufficient_balance',
      code: 'INSUFFICIENT_TOKENS',
      message: 'Saldo token tidak cukup.',
      httpStatus: 402,
      requestId: 'req_abc',
    });
    const { message, requestId } = userMessageForError(err);
    expect(message).toBe('Saldo token tidak cukup.');
    expect(requestId).toBe('req_abc');
  });

  it('never leaks raw exception text for unknown errors', () => {
    const { message, requestId } = userMessageForError(new Error('sensitive db constraint xyz'));
    expect(message).not.toContain('sensitive');
    expect(message).not.toContain('constraint');
    expect(requestId).toBeNull();
  });
});
