import { describe, it, expect } from 'vitest';
import { chatTurnResultSchema, transcribeResponseSchema } from '@/services/api/dto/domain.dto';
import { ApiMediaService, MediaFinalizeResult } from '@/services/api/ApiMediaService';

/**
 * Kontrak voice message: backend mengirim audio TTS top-level (audio_url,
 * object_key, bucket, audio_duration_ms), BUKAN di dalam `audio` record.
 * Media lifecycle fail-closed: finalize synchronous scan menentukan kesiapan.
 */
describe('chatTurnResultSchema (voice turn wire)', () => {
  it('decodes top-level audio_url/object_key/bucket dari backend', () => {
    const parsed = chatTurnResultSchema.parse({
      session_id: 's1',
      message_id: 'm-agent-1',
      user_message_id: 'm-user-1',
      schema_version: '3',
      request_id: 'r1',
      status: 'completed',
      response_text: 'Halo',
      citations: [],
      tool_outcomes: [],
      audio_url: 'https://s3.flyup.id/bucket/agent/reply.mp3',
      audio_duration_ms: null,
      object_key: 'agent/reply.mp3',
      bucket: 'bucket',
      background_dispatch_ref: null,
    });
    expect(parsed.audio_url).toContain('reply.mp3');
    expect(parsed.object_key).toBe('agent/reply.mp3');
    expect(parsed.message_id).toBe('m-agent-1');
  });

  it('toleran bila field audio opsional absen (text-only reply)', () => {
    const parsed = chatTurnResultSchema.parse({
      session_id: 's1',
      schema_version: '3',
      request_id: 'r1',
      status: 'completed',
      response_text: 'Text only',
    });
    expect(parsed.audio_url).toBeUndefined();
  });
});

/**
 * Kontrak flow voice message 3-hit: upload → transcribe → send message.
 * Transcribe endpoint: POST /media/{media_id}:transcribe → { text }.
 */
describe('transcribeResponseSchema (POST /media/{id}:transcribe)', () => {
  it('decodes text transcript dari backend', () => {
    const parsed = transcribeResponseSchema.parse({
      text: 'I wanna go to Paris in this week.',
    });
    expect(parsed.text).toBe('I wanna go to Paris in this week.');
  });

  it('menolak response tanpa field text', () => {
    expect(() => transcribeResponseSchema.parse({})).toThrow();
    expect(() => transcribeResponseSchema.parse({ transcript: 'wrong key' })).toThrow();
  });
});

/**
 * Kontrak body request voice message: client mengirim text (hasil transcribe)
 * dan audio_duration_ms (dari recorder) ke voice-messages(:stream).
 */
describe('voice message request body (3-hit flow)', () => {
  const buildVoiceBody = (input: {
    mediaId: string;
    text?: string | null;
    audioDurationMs?: number | null;
    clientMessageId: string;
  }) => ({
    media_id: input.mediaId,
    text: input.text ?? null,
    audio_duration_ms: input.audioDurationMs ?? null,
    client_message_id: input.clientMessageId,
  });

  it('menyertakan text dan audio_duration_ms saat keduanya tersedia', () => {
    expect(
      buildVoiceBody({
        mediaId: 'm1',
        text: 'I wanna go to Paris in this week.',
        audioDurationMs: 3800,
        clientMessageId: 'idem_1',
      }),
    ).toEqual({
      media_id: 'm1',
      text: 'I wanna go to Paris in this week.',
      audio_duration_ms: 3800,
      client_message_id: 'idem_1',
    });
  });

  it('tetap mengirim null untuk field yang absen (backward compatible)', () => {
    expect(buildVoiceBody({ mediaId: 'm1', clientMessageId: 'idem_1' })).toEqual({
      media_id: 'm1',
      text: null,
      audio_duration_ms: null,
      client_message_id: 'idem_1',
    });
  });
});

describe('ApiMediaService.assertMediaReady (fail-closed)', () => {
  // HttpTransport tidak dipakai oleh assertMediaReady → aman di-pass stub.
  const service = new ApiMediaService(null as never);

  const base: MediaFinalizeResult = {
    mediaId: 'm1',
    mediaType: 'audio',
    status: 'finalized',
    scanState: 'clean',
  };

  it('lolos bila finalized + clean', () => {
    expect(service.assertMediaReady(base)).toEqual(base);
  });

  it('menolak media malicious / rejected', () => {
    expect(() =>
      service.assertMediaReady({ ...base, status: 'rejected', scanState: 'malicious' }),
    ).toThrow(/ditolak/i);
  });

  it('menolak media yang masih pending scan (scanner down)', () => {
    expect(() =>
      service.assertMediaReady({ ...base, status: 'uploaded', scanState: 'pending' }),
    ).toThrow(/belum siap/i);
  });

  it('menolak kombinasi finalized tapi scan belum clean', () => {
    expect(() =>
      service.assertMediaReady({ ...base, status: 'finalized', scanState: 'pending' }),
    ).toThrow(/belum siap/i);
  });
});
