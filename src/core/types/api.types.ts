/**
 * Universal Enterprise API Response Envelopes & Error Contracts
 */

export interface ApiErrorResponse {
  readonly code: string;
  readonly message: string;
  readonly httpStatus: number;
  readonly requestId: string;
  readonly timestamp: string;
  readonly details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: ApiErrorResponse;
  readonly timestamp: string;
}

export interface PaginationParams {
  readonly page: number;
  readonly limit: number;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  readonly pagination?: {
    readonly currentPage: number;
    readonly totalPages: number;
    readonly totalItems: number;
    readonly hasNextPage: boolean;
  };
}
