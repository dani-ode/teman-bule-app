/**
 * Development-only HTTP request/response logger with mandatory redaction.
 *
 * Policy (auth-security.md / engineering-rules.md R05):
 * - Never log JWT/refresh tokens, passwords, BYOK api_key, one-time email/reset
 *   tokens, LiveKit tokens, signed upload/download URLs, or OAuth
 *   authorization URLs.
 * - Server `request_id` is preserved for correlation (R02 diagnostics).
 * - Inert outside development: `isHttpLoggingEnabled()` is false in
 *   staging/production and every log call is a no-op, so release builds emit
 *   no HTTP logs.
 */

import { envConfig } from '@/config/env.config';

const REDACTED = '[REDACTED]';
const MAX_FIELD_LENGTH = 256;
const MAX_DEPTH = 4;

/** Exact JSON field names (already lower-cased) that are always redacted. */
const SENSITIVE_FIELD_NAMES: ReadonlySet<string> = new Set([
  'password',
  'new_password',
  'old_password',
  'current_password',
  'token',
  'access_token',
  'refresh_token',
  'id_token',
  'api_key',
  'apikey',
  'secret',
  'client_secret',
  'authorization',
  'set-cookie',
  'cookie',
  'upload_url',
  'download_url',
  'signed_url',
  'authorization_url',
  'participant_token',
  'livekit_token',
]);

/** Substring match on lower-cased field names (catches `*_token` etc.). */
const SENSITIVE_FIELD_FRAGMENTS: readonly string[] = ['token', 'secret', 'password'];

/** URL path prefixes whose bodies carry auth material; never log their payloads. */
const SENSITIVE_PATH_PREFIXES: readonly string[] = [
  '/auth/',
  '/me/ai-credentials',
];

const isSensitiveFieldName = (key: string): boolean => {
  const normalized = key.toLowerCase();
  if (SENSITIVE_FIELD_NAMES.has(normalized)) return true;
  return SENSITIVE_FIELD_FRAGMENTS.some((fragment) => normalized.includes(fragment));
};

const truncate = (value: string): string =>
  value.length > MAX_FIELD_LENGTH ? `${value.slice(0, MAX_FIELD_LENGTH)}…[truncated]` : value;

/** Deep-clone `value` with sensitive fields replaced by a redaction marker. */
const sanitizeValue = (value: unknown, depth: number): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return truncate(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (depth >= MAX_DEPTH) return '[depth-limit]';
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      output[key] = isSensitiveFieldName(key) ? REDACTED : sanitizeValue(entry, depth + 1);
    }
    return output;
  }
  return String(value);
};

/** Bodies on auth/BYOK endpoints must not appear in logs at all. */
const isSensitivePath = (path: string): boolean =>
  SENSITIVE_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));

export interface HttpLogRecord {
  /** Monotonic correlation id for pairing request/response log lines. */
  readonly seq: number;
  readonly method: string;
  readonly path: string;
  readonly idempotencyKey: string | null;
  readonly authorized: boolean;
  readonly body: unknown;
}

export interface HttpResponseLogRecord {
  readonly seq: number;
  readonly method: string;
  readonly path: string;
  readonly status: number | null;
  readonly elapsedMs: number;
  /** Server-issued correlation id when present in the wire envelope. */
  readonly requestId: string | null;
  readonly errorCode: string | null;
  readonly body: unknown;
}

export interface HttpTransportErrorLogRecord {
  readonly seq: number;
  readonly method: string;
  readonly path: string;
  readonly elapsedMs: number;
  readonly errorCode: string | null;
}

export interface HttpLogger {
  logRequest(record: HttpLogRecord): void;
  logResponse(record: HttpResponseLogRecord): void;
  logTransportError(record: HttpTransportErrorLogRecord): void;
}

let sequence = 0;

export const nextHttpLogSequence = (): number => {
  sequence += 1;
  return sequence;
};

/** True only for development builds; staging/production never log HTTP traffic. */
export const isHttpLoggingEnabled = (): boolean => envConfig.environment === 'development';

export const buildRequestLogRecord = (input: {
  method: string;
  path: string;
  idempotencyKey?: string;
  authorized: boolean;
  body?: unknown;
}): HttpLogRecord => ({
  seq: nextHttpLogSequence(),
  method: input.method,
  path: input.path,
  idempotencyKey: input.idempotencyKey ?? null,
  authorized: input.authorized,
  body:
    input.body === undefined || isSensitivePath(input.path)
      ? undefined
      : sanitizeValue(input.body, 0),
});

export const buildResponseLogRecord = (input: {
  seq: number;
  method: string;
  path: string;
  status: number | null;
  elapsedMs: number;
  requestId: string | null;
  errorCode: string | null;
  body?: unknown;
}): HttpResponseLogRecord => ({
  seq: input.seq,
  method: input.method,
  path: input.path,
  status: input.status,
  elapsedMs: input.elapsedMs,
  requestId: input.requestId,
  errorCode: input.errorCode,
  body:
    input.body === undefined || isSensitivePath(input.path)
      ? undefined
      : sanitizeValue(input.body, 0),
});

/** Extract correlation fields from the backend wire envelope without leaking content. */
export const extractWireCorrelation = (
  rawJson: unknown,
): { requestId: string | null; errorCode: string | null } => {
  if (rawJson === null || typeof rawJson !== 'object') {
    return { requestId: null, errorCode: null };
  }
  const envelope = rawJson as { error?: { request_id?: unknown; code?: unknown } };
  const error = envelope.error;
  if (!error || typeof error !== 'object') {
    return { requestId: null, errorCode: null };
  }
  return {
    requestId: typeof error.request_id === 'string' ? error.request_id : null,
    errorCode: typeof error.code === 'string' ? error.code : null,
  };
};

/** Console-backed logger. All methods are no-ops outside development. */
export const consoleHttpLogger: HttpLogger = {
  logRequest(record) {
    if (!isHttpLoggingEnabled()) return;
    const lines = [
      `[HTTP #${record.seq}] -> ${record.method} ${record.path}`,
      `  auth: ${record.authorized ? 'bearer [REDACTED]' : 'anonymous'}`,
    ];
    if (record.idempotencyKey) lines.push(`  idempotency: ${record.idempotencyKey}`);
    if (record.body !== undefined) lines.push(`  body: ${JSON.stringify(record.body, null, 2)}`);
    console.log(lines.join('\n'));
  },
  logResponse(record) {
    if (!isHttpLoggingEnabled()) return;
    const lines = [
      `[HTTP #${record.seq}] <- ${record.status ?? '???'} ${record.method} ${record.path} (${record.elapsedMs}ms)`,
    ];
    if (record.requestId) lines.push(`  request_id: ${record.requestId}`);
    if (record.errorCode) lines.push(`  error_code: ${record.errorCode}`);
    if (record.body !== undefined) lines.push(`  body: ${JSON.stringify(record.body, null, 2)}`);
    console.log(lines.join('\n'));
  },
  logTransportError(record) {
    if (!isHttpLoggingEnabled()) return;
    console.warn(
      `[HTTP #${record.seq}] xx ${record.method} ${record.path}` +
        ` (${record.elapsedMs}ms) code=${record.errorCode ?? 'ERR_NETWORK'}`,
    );
  },
};
