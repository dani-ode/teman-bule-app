import { describe, it, expect } from 'vitest';
import { chatTurnResultSchema } from '@/services/api/dto/domain.dto';
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
