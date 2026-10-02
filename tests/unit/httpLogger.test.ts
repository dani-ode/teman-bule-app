import { describe, it, expect, vi } from 'vitest';

// env.config validates process.env at module load; unit tests stub the module
// so redaction logic can be tested without a full Expo environment.
vi.mock('@/config/env.config', () => ({
  envConfig: {
    environment: 'development',
    useMockData: false,
    mockLatencyMs: 0,
    apiBaseUrl: 'http://localhost:8000/v1',
    apiTimeoutMs: 15000,
    appName: 'teman-bule',
    appVersion: '0.0.0-test',
  },
}));

import {
  buildRequestLogRecord,
  buildResponseLogRecord,
  extractWireCorrelation,
  isHttpLoggingEnabled,
} from '@/core/network/httpLogger';

describe('httpLogger redaction', () => {
  it('redacts password and token fields in request bodies', () => {
    const record = buildRequestLogRecord({
      method: 'POST',
      path: '/practice/sessions',
      authorized: true,
      body: { password: 'hunter2', access_token: 'jwt-abc', topic: 'grammar' },
    });
    const body = record.body as Record<string, unknown>;
    expect(body.password).toBe('[REDACTED]');
    expect(body.access_token).toBe('[REDACTED]');
    expect(body.topic).toBe('grammar');
  });

  it('redacts nested sensitive fields by name fragment', () => {
    const record = buildResponseLogRecord({
      seq: 1,
      method: 'GET',
      path: '/me/profile',
      status: 200,
      elapsedMs: 12,
      requestId: null,
      errorCode: null,
      body: {
        user: { participant_token: 'lk-123', display_name: 'Dani' },
        items: [{ client_secret: 'shh', value: 1 }],
      },
    });
    const body = record.body as {
      user: Record<string, unknown>;
      items: Array<Record<string, unknown>>;
    };
    expect(body.user.participant_token).toBe('[REDACTED]');
    expect(body.user.display_name).toBe('Dani');
    expect(body.items[0].client_secret).toBe('[REDACTED]');
    expect(body.items[0].value).toBe(1);
  });

  it('never logs bodies on auth endpoints', () => {
    const record = buildRequestLogRecord({
      method: 'POST',
      path: '/auth/login',
      authorized: false,
      body: { email: 'a@b.c', password: 'hunter2' },
    });
    expect(record.body).toBeUndefined();
  });

  it('never logs bodies on BYOK credential endpoints', () => {
    const record = buildRequestLogRecord({
      method: 'POST',
      path: '/me/ai-credentials',
      authorized: true,
      body: { provider_id: 'openai', api_key: 'sk-xyz' },
    });
    expect(record.body).toBeUndefined();
  });

  it('truncates long string values', () => {
    const record = buildRequestLogRecord({
      method: 'POST',
      path: '/practice/sessions',
      authorized: true,
      body: { text: 'x'.repeat(500) },
    });
    const body = record.body as Record<string, unknown>;
    expect((body.text as string).length).toBeLessThan(500);
    expect((body.text as string)).toContain('[truncated]');
  });
});

describe('extractWireCorrelation', () => {
  it('extracts request_id and code from the error envelope', () => {
    const { requestId, errorCode } = extractWireCorrelation({
      error: { code: 'INSUFFICIENT_TOKENS', message: 'm', request_id: 'req_9', details: [] },
    });
    expect(requestId).toBe('req_9');
    expect(errorCode).toBe('INSUFFICIENT_TOKENS');
  });

  it('returns nulls for success payloads', () => {
    const { requestId, errorCode } = extractWireCorrelation({ user_id: 'u1' });
    expect(requestId).toBeNull();
    expect(errorCode).toBeNull();
  });
});

describe('isHttpLoggingEnabled', () => {
  it('is enabled in the development test environment', () => {
    expect(isHttpLoggingEnabled()).toBe(true);
  });
});
