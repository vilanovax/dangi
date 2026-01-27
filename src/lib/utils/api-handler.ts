import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError, isAppError, RateLimitError } from '@/lib/errors'
import { logger } from './logger'

/**
 * Centralized Error Handler for API Routes
 * Handles all types of errors and returns appropriate HTTP responses
 */
export function handleApiError(error: unknown): NextResponse {
  // ─────────────────────────────────────────────────────────────
  // Zod Validation Errors
  // ─────────────────────────────────────────────────────────────
  if (error instanceof ZodError) {
    const messages = error.issues.map((e) => {
      const path = e.path.join('.')
      return path ? `${path}: ${e.message}` : e.message
    })

    logger.warn('Validation error', { errors: messages })

    return NextResponse.json(
      {
        error: 'خطای اعتبارسنجی',
        code: 'VALIDATION_ERROR',
        details: messages,
      },
      { status: 400 }
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Custom Application Errors
  // ─────────────────────────────────────────────────────────────
  if (isAppError(error)) {
    // Log 5xx errors as errors, others as warnings
    if (error.statusCode >= 500) {
      logger.error('Application error (5xx)', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
      })
    } else {
      logger.warn('Application error (4xx)', {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
      })
    }

    const response: Record<string, unknown> = {
      error: error.message,
      code: error.code,
    }

    // Include retryAfter for rate limit errors
    if (error instanceof RateLimitError && error.retryAfter) {
      response.retryAfter = error.retryAfter
    }

    return NextResponse.json(response, { status: error.statusCode })
  }

  // ─────────────────────────────────────────────────────────────
  // Prisma Errors
  // ─────────────────────────────────────────────────────────────
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as {
      code: string
      meta?: Record<string, unknown>
      message?: string
    }

    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      logger.warn('Prisma unique constraint violation', {
        code: prismaError.code,
        meta: prismaError.meta,
      })

      return NextResponse.json(
        {
          error: 'این مورد قبلاً ثبت شده است',
          code: 'DUPLICATE_ENTRY',
        },
        { status: 409 }
      )
    }

    // Record not found
    if (prismaError.code === 'P2025') {
      logger.warn('Prisma record not found', {
        code: prismaError.code,
        meta: prismaError.meta,
      })

      return NextResponse.json(
        {
          error: 'مورد درخواستی یافت نشد',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      logger.warn('Prisma foreign key constraint violation', {
        code: prismaError.code,
        meta: prismaError.meta,
      })

      return NextResponse.json(
        {
          error: 'خطا در ارتباط با سایر داده‌ها',
          code: 'FOREIGN_KEY_CONSTRAINT',
        },
        { status: 400 }
      )
    }

    // Other Prisma errors
    logger.error('Prisma database error', {
      code: prismaError.code,
      message: prismaError.message,
      meta: prismaError.meta,
    })

    return NextResponse.json(
      {
        error: 'خطا در عملیات دیتابیس',
        code: 'DATABASE_ERROR',
      },
      { status: 500 }
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Unexpected Errors
  // ─────────────────────────────────────────────────────────────
  if (error instanceof Error) {
    logger.error('Unexpected error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
  } else {
    logger.error('Unknown error type', { error: String(error) })
  }

  return NextResponse.json(
    {
      error: 'خطای داخلی سرور',
      code: 'INTERNAL_SERVER_ERROR',
    },
    { status: 500 }
  )
}

/**
 * API Route Handler Wrapper
 * Automatically catches errors and passes them to handleApiError
 *
 * @example
 * export const GET = apiHandler(async (req: Request) => {
 *   // Your handler code
 *   return NextResponse.json({ data })
 * })
 */
export function apiHandler<T = unknown>(
  handler: (req: Request) => Promise<NextResponse<T>>
) {
  return async (req: Request): Promise<NextResponse<T>> => {
    try {
      return await handler(req)
    } catch (error) {
      return handleApiError(error) as NextResponse<T>
    }
  }
}

/**
 * API Route Handler Wrapper with Context
 * Similar to apiHandler but accepts dynamic path parameters
 *
 * @example
 * export const GET = apiHandlerWithContext(async (req: Request, context) => {
 *   const { params } = context
 *   const id = params.id
 *   // Your handler code
 *   return NextResponse.json({ data })
 * })
 */
export function apiHandlerWithContext<T = unknown>(
  handler: (
    req: Request,
    context: { params: Promise<Record<string, string>> }
  ) => Promise<NextResponse<T>>
) {
  return async (
    req: Request,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse<T>> => {
    try {
      return await handler(req, context)
    } catch (error) {
      return handleApiError(error) as NextResponse<T>
    }
  }
}
