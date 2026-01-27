/**
 * Custom Error Classes for Application
 * Provides structured error handling with HTTP status codes and error codes
 */

/**
 * Base Application Error
 * All custom errors extend from this class
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code?: string
  public readonly isOperational: boolean
  public readonly timestamp: Date

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true
  ) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.timestamp = new Date()

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
    }
  }
}

/**
 * Validation Error (400)
 * Used for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 400, code || 'VALIDATION_ERROR')
  }
}

/**
 * Authentication Error (401)
 * Used when user is not authenticated
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'لطفاً وارد حساب کاربری خود شوید') {
    super(message, 401, 'AUTHENTICATION_ERROR')
  }
}

/**
 * Authorization Error (403)
 * Used when user is authenticated but lacks permission
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'شما به این منبع دسترسی ندارید') {
    super(message, 403, 'AUTHORIZATION_ERROR')
  }
}

/**
 * Not Found Error (404)
 * Used when a resource is not found
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'منبع') {
    super(`${resource} یافت نشد`, 404, 'NOT_FOUND')
  }
}

/**
 * Conflict Error (409)
 * Used for conflicts like duplicate entries
 */
export class ConflictError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 409, code || 'CONFLICT')
  }
}

/**
 * Rate Limit Error (429)
 * Used when rate limits are exceeded
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number

  constructor(message: string = 'تعداد درخواست‌های شما بیش از حد مجاز است', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.retryAfter = retryAfter
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    }
  }
}

/**
 * Internal Server Error (500)
 * Used for unexpected server errors
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'خطای داخلی سرور', code?: string) {
    super(message, 500, code || 'INTERNAL_SERVER_ERROR', false)
  }
}

/**
 * Bad Gateway Error (502)
 * Used when external service fails
 */
export class BadGatewayError extends AppError {
  constructor(message: string = 'خطا در ارتباط با سرویس خارجی', service?: string) {
    super(message, 502, service ? `BAD_GATEWAY_${service.toUpperCase()}` : 'BAD_GATEWAY')
  }
}

/**
 * Service Unavailable Error (503)
 * Used when service is temporarily unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'سرویس در حال حاضر در دسترس نیست') {
    super(message, 503, 'SERVICE_UNAVAILABLE')
  }
}

/**
 * Database Error
 * Wrapper for database-related errors
 */
export class DatabaseError extends AppError {
  public readonly originalError?: Error

  constructor(message: string, originalError?: Error) {
    super(message, 500, 'DATABASE_ERROR', false)
    this.originalError = originalError
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Type guard to check if error is operational (expected)
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational
  }
  return false
}
