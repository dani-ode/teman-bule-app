import { describe, it, expect } from 'vitest';
import {
  sessionResponseSchema,
  messageResponseSchema,
  chatTurnMessagesSchema,
  chatTurnResultSchema,
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

  it('decodes a message with optional content fields', () => {
    const parsed = messageResponseSchema.parse({
      message_id: 'm2',
      session_id: 's1',
      role: 'agent',
      sequence: 2,
      terminal_state: 'final',
      created_at: '2026-09-25T00:00:00Z',
      text: 'Halo!',
      modality: 'audio',
      audio_url: 'https://minio.local/bucket/greeting.mp3',
      audio_duration_ms: 3200,
    });
    expect(parsed.text).toBe('Halo!');
    expect(parsed.audio_url).toContain('minio');
  });

  it('decodes a chat-turn envelope { user_message, ai_message }', () => {
    const parsed = chatTurnMessagesSchema.parse({
      user_message: {
        message_id: 'u1',
        session_id: 's1',
        role: 'user',
        sequence: 3,
        terminal_state: 'completed',
        created_at: '2026-09-25T00:00:00Z',
        text: 'hi',
      },
      ai_message: {
        message_id: 'a1',
        session_id: 's1',
        role: 'agent',
        sequence: 4,
        terminal_state: 'final',
        created_at: '2026-09-25T00:00:01Z',
        text: 'hello there',
        modality: 'audio',
        audio_url: 'https://minio.local/bucket/reply.mp3',
        audio_duration_ms: 2100,
      },
    });
    expect(parsed.ai_message?.role).toBe('agent');
  });

  it('decodes the production send-message ChatResult envelope', () => {
    // Shape aktual dari POST /practice/sessions/{id}/messages (201):
    // ChatResult Langflow + session_id/message_id/user_message_id, audio TTS
    // top-level. Regression test: sendMessage dulu gagal decode shape ini.
    const parsed = chatTurnResultSchema.parse({
      session_id: '01M4N5ZN2S3A51RG6FJ2Q0ECMT',
      message_id: '01M4NK5HWZ56FMMC5JZB8E6PWS',
      user_message_id: '01M4NK5HWMZ3TJKVG2FDH11Z1Z',
      schema_version: '3',
      request_id: '01M4NK4BB8A22F2A86160CP8TK',
      status: 'completed',
      response_text: 'Jamaica sounds heavenly right now...',
      citations: [],
      tool_outcomes: [],
      audio_url: 'https://s3.flyup.id/teman-bule/reply.mp3',
      audio_duration_ms: null,
      object_key: 'teman-bule/reply.mp3',
      bucket: 'teman-bule',
      background_dispatch_ref: null,
    });
    expect(parsed.status).toBe('completed');
    expect(parsed.audio_url).toContain('s3.flyup.id');
    // Tidak cocok dengan schema message tunggal / chat-turn envelope.
    expect(messageResponseSchema.safeParse(parsed).success).toBe(false);
    expect(chatTurnMessagesSchema.safeParse(parsed).success).toBe(false);
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
