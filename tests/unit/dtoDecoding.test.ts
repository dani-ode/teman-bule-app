import { describe, it, expect } from 'vitest';
import {
  sessionResponseSchema,
  messageResponseSchema,
  callResponseSchema,
} from '@/services/api/dto/domain.dto';
import { walletResponseSchema } from '@/services/api/dto/account.dto';
import { tokenPairResponseSchema } from '@/services/api/dto/auth.dto';

/**
 * DTO boundary decoding: unknown wire data must validate against the
 * approved schema; unknown/mismatched shapes fail (R02, no unchecked casts).
 */
describe('wire DTO decoding', () => {
  it('decodes a token pair', () => {
    const parsed = tokenPairResponseSchema.parse({
      access_token: 'a',
      refresh_token: 'r',
      token_type: 'bearer',
      expires_in: 900,
    });
    expect(parsed.expires_in).toBe(900);
  });

  it('decodes a practice session', () => {
    const parsed = sessionResponseSchema.parse({
      session_id: '01M3',
      kind: 'chat',
      state: 'active',
      started_at: '2026-09-25T00:00:00Z',
    });
    expect(parsed.state).toBe('active');
  });

  it('decodes a message with integer sequence', () => {
    const parsed = messageResponseSchema.parse({
      message_id: 'm1',
      session_id: 's1',
      role: 'user',
      sequence: 1,
      terminal_state: 'completed',
      created_at: '2026-09-25T00:00:00Z',
    });
    expect(parsed.sequence).toBe(1);
  });

  it('rejects a message with non-integer sequence', () => {
    const bad = {
      message_id: 'm1',
      session_id: 's1',
      role: 'user',
      sequence: 'one',
      terminal_state: 'completed',
      created_at: '2026-09-25T00:00:00Z',
    };
    expect(messageResponseSchema.safeParse(bad).success).toBe(false);
  });

  it('decodes a wallet with integer units (no float money)', () => {
    const parsed = walletResponseSchema.parse({
      asset: 'token',
      available_units: 1000,
      held_units: 50,
      version: 3,
    });
    expect(Number.isInteger(parsed.available_units)).toBe(true);
  });

  it('rejects a wallet with float units', () => {
    const bad = { asset: 'token', available_units: 10.5, held_units: 0, version: 1 };
    expect(walletResponseSchema.safeParse(bad).success).toBe(false);
  });

  it('decodes a call with nullable end_reason', () => {
    const parsed = callResponseSchema.parse({
      session_id: 'c1',
      mode: 'voice',
      state: 'ended',
      room_name: 'call-c1',
      end_reason: 'user_hangup',
    });
    expect(parsed.end_reason).toBe('user_hangup');
  });
});
