/**
 * Typed client errors. Transport/domain failures are surfaced explicitly;
 * no silent fallback, no swallowed exceptions.
 */

export type ClientErrorKind =
  | 'config'
  | 'network'
  | 'timeout'
  | 'abort'
  | 'contract'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'insufficient_balance'
  | 'validation'
  | 'rate_limited'
  | 'provider'
  | 'unavailable'
  | 'unknown';

export class ClientError extends Error {
  public readonly kind: ClientErrorKind;
  /** Stable wire code from backend, or a local code for client-side failures. */
  public readonly code: string;
  public readonly httpStatus: number | null;
  /** Server-issued request correlation; null for client-side failures. */
  public readonly requestId: string | null;
  public readonly details: readonly unknown[];

  constructor(args: {
    kind: ClientErrorKind;
    code: string;
    message: string;
    httpStatus?: number | null;
    requestId?: string | null;
    details?: readonly unknown[];
  }) {
    super(args.message);
    this.name = 'ClientError';
    this.kind = args.kind;
    this.code = args.code;
    this.httpStatus = args.httpStatus ?? null;
    this.requestId = args.requestId ?? null;
    this.details = args.details ?? [];
  }
}

export class ContractError extends ClientError {
  constructor(message: string, details?: readonly unknown[]) {
    super({ kind: 'contract', code: 'ERR_CONTRACT', message, details });
    this.name = 'ContractError';
  }
}

export const isClientError = (value: unknown): value is ClientError =>
  value instanceof ClientError;
