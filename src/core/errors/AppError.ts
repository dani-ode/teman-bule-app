import { ApiErrorResponse } from '../types/api.types';

/**
 * Base Enterprise Application Exception
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly requestId: string;
  public readonly timestamp: string;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string = 'ERR_INTERNAL_APP',
    httpStatus: number = 500,
    requestId: string = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.httpStatus = httpStatus;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toApiErrorResponse(): ApiErrorResponse {
    return {
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
      requestId: this.requestId,
      timestamp: this.timestamp,
      details: this.details,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resourceName: string, identifier: string, requestId?: string) {
    super(
      `Resource '${resourceName}' with ID '${identifier}' was not found.`,
      'ERR_RESOURCE_NOT_FOUND',
      404,
      requestId
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>, requestId?: string) {
    super(message, 'ERR_VALIDATION_FAILED', 400, requestId, details);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network failure or timeout occurred.', requestId?: string) {
    super(message, 'ERR_NETWORK_FAILURE', 503, requestId);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service is currently unavailable.', requestId?: string) {
    super(message, 'ERR_SERVICE_UNAVAILABLE', 503, requestId);
  }
}
