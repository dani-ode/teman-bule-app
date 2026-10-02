import { z } from 'zod';
import { envConfig } from '@/config/env.config';
import { ClientError, ContractError } from '@/core/errors/ClientError';
import { wireErrorEnvelopeSchema } from '@/core/types/wire.types';
import { AccessTokenStore } from '@/core/auth/AccessTokenStore';
import {
  HttpLogger,
  buildRequestLogRecord,
  buildResponseLogRecord,
  consoleHttpLogger,
  extractWireCorrelation,
} from './httpLogger';

/**
 * Authenticated HTTP transport.
 *
 * - Decodes the backend wire error envelope; preserves server `request_id`.
 * - Maps HTTP status to typed ClientError kinds (R04/api-contracts.md).
 * - Single coordinated token refresh on 401 (single-flight): one refresh
 *   promise shared by concurrent requests; safe idempotent replay only.
 * - Timeout does not imply no side effect; callers reconcile unknown outcomes.
 * - Development-only request/response logging via HttpLogger with mandatory
 *   redaction of tokens, passwords, BYOK keys and signed URLs (R05).
 */

export interface RequestOptions {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly path: string;
  readonly body?: unknown;
  readonly idempotencyKey?: string;
  readonly signal?: AbortSignal;
  /** Skip the Authorization header (public endpoints). */
  readonly anonymous?: boolean;
  /** Skip the automatic 401 refresh flow (auth endpoints themselves). */
  readonly skipAuthRefresh?: boolean;
}

export interface SessionActions {
  /** Perform a single-flight refresh; throws on failure. */
  refresh(): Promise<string>;
  /** Terminal session cleanup: clear tokens, caches, notify UI. */
  onSessionExpired(): void;
}

const statusToKind = (status: number): ClientError['kind'] => {
  switch (status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return 'conflict';
    case 402:
      return 'insufficient_balance';
    case 422:
    case 413:
      return 'validation';
    case 429:
      return 'rate_limited';
    case 502:
      return 'provider';
    case 503:
      return 'unavailable';
    default:
      return status >= 500 ? 'unavailable' : 'unknown';
  }
};

export class HttpTransport {
  private refreshPromise: Promise<string> | null = null;

  constructor(
    private readonly tokenStore: AccessTokenStore,
    private readonly session: SessionActions,
    private readonly logger: HttpLogger = consoleHttpLogger,
  ) {}

  private buildUrl(path: string): string {
    if (!path.startsWith('/')) {
      throw new ContractError(`API path must start with '/': ${path}`);
    }
    if (path.startsWith('/v1')) {
      throw new ContractError(`API path must not duplicate /v1 prefix: ${path}`);
    }
    return `${envConfig.apiBaseUrl}${path}`;
  }

  private async refreshSingleFlight(): Promise<string> {
    if (this.refreshPromise === null) {
      this.refreshPromise = this.session
        .refresh()
        .finally(() => {
          this.refreshPromise = null;
        });
    }
    return this.refreshPromise;
  }

  private async execute(
    options: RequestOptions,
    accessToken: string | null,
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), envConfig.apiTimeoutMs);
    if (options.signal) {
      if (options.signal.aborted) {
        controller.abort();
      } else {
        options.signal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }
    if (!options.anonymous && accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
      return await fetch(this.buildUrl(options.path), {
        method: options.method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
        credentials: 'omit',
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  public async request(options: RequestOptions): Promise<unknown> {
    const startedAt = Date.now();
    const requestRecord = buildRequestLogRecord({
      method: options.method,
      path: options.path,
      idempotencyKey: options.idempotencyKey,
      authorized: !options.anonymous && this.tokenStore.get() !== null,
      body: options.body,
    });
    this.logger.logRequest(requestRecord);

    let accessToken = this.tokenStore.get();
    let response: Response;
    try {
      response = await this.execute(options, accessToken);
    } catch (error) {
      const mapped = this.mapTransportError(error);
      this.logger.logTransportError({
        seq: requestRecord.seq,
        method: options.method,
        path: options.path,
        elapsedMs: Date.now() - startedAt,
        errorCode: mapped.code,
      });
      throw mapped;
    }

    // One coordinated refresh on 401; never an unbounded auth retry loop.
    if (
      response.status === 401 &&
      !options.anonymous &&
      !options.skipAuthRefresh
    ) {
      try {
        accessToken = await this.refreshSingleFlight();
      } catch (refreshError) {
        this.session.onSessionExpired();
        if (refreshError instanceof ClientError) throw refreshError;
        throw new ClientError({
          kind: 'unauthorized',
          code: 'ERR_SESSION_EXPIRED',
          message: 'Your session has expired. Please sign in again.',
          httpStatus: 401,
        });
      }
      try {
        response = await this.execute(options, accessToken);
      } catch (error) {
        const mapped = this.mapTransportError(error);
        this.logger.logTransportError({
          seq: requestRecord.seq,
          method: options.method,
          path: options.path,
          elapsedMs: Date.now() - startedAt,
          errorCode: mapped.code,
        });
        throw mapped;
      }
    }

    return this.decodeResponse(response, {
      seq: requestRecord.seq,
      method: options.method,
      path: options.path,
      startedAt,
    });
  }

  private mapTransportError(error: unknown): ClientError {
    if (error instanceof ClientError) return error;
    if (error instanceof Error && error.name === 'AbortError') {
      return new ClientError({
        kind: 'timeout',
        code: 'ERR_REQUEST_TIMEOUT',
        message: 'The request timed out. Please check your connection.',
      });
    }
    return new ClientError({
      kind: 'network',
      code: 'ERR_NETWORK',
      message: 'Unable to connect to the server. Please check your connection.',
    });
  }

  private async decodeResponse(
    response: Response,
    logContext: {
      seq: number;
      method: string;
      path: string;
      startedAt: number;
    },
  ): Promise<unknown> {
    const elapsedMs = Date.now() - logContext.startedAt;
    const logBody = (rawJson: unknown) => {
      const { requestId, errorCode } = extractWireCorrelation(rawJson);
      this.logger.logResponse(
        buildResponseLogRecord({
          seq: logContext.seq,
          method: logContext.method,
          path: logContext.path,
          status: response.status,
          elapsedMs,
          requestId,
          errorCode,
          body: rawJson,
        }),
      );
    };

    // Successful mutation may return 204 without a JSON body.
    if (response.status === 204) {
      logBody(null);
      return null;
    }

    const rawText = await response.text();
    let rawJson: unknown = null;
    if (rawText.length > 0) {
      try {
        rawJson = JSON.parse(rawText);
      } catch {
        logBody(null);
        throw new ContractError('Server returned a non-JSON payload.', [
          { status: response.status },
        ]);
      }
    }

    logBody(rawJson);

    if (!response.ok) {
      const parsed = wireErrorEnvelopeSchema.safeParse(rawJson);
      if (parsed.success) {
        const { code, message, request_id, details } = parsed.data.error;
        throw new ClientError({
          kind: statusToKind(response.status),
          code,
          message,
          httpStatus: response.status,
          requestId: request_id,
          details,
        });
      }
      throw new ClientError({
        kind: statusToKind(response.status),
        code: 'ERR_UNSTRUCTURED_ERROR',
        message: 'An unrecognized error occurred.',
        httpStatus: response.status,
      });
    }

    return rawJson;
  }
}

/** Decode `unknown` wire data against a schema at the boundary (R02). */
export const decode = <S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ContractError('Server response does not match the approved schema.', result.error.issues);
  }
  return result.data;
};
