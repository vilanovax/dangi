import winston from 'winston'
import path from 'path'

const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

// Create logs directory path
const logsDir = path.join(process.cwd(), 'logs')

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
)

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`
    if (Object.keys(meta).length > 0) {
      msg += `\n${JSON.stringify(meta, null, 2)}`
    }
    return msg
  })
)

// Create transports array
const transports: winston.transport[] = []

// File transports for production
if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  )
}

// Console transport for development
if (isDevelopment || !isProduction) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  )
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: logFormat,
  defaultMeta: { service: 'dangi' },
  transports,
  // Don't exit on error
  exitOnError: false,
})

// Helper functions for API logging
export const logApiRequest = (method: string, path: string, meta?: Record<string, unknown>) => {
  logger.info('API Request', { method, path, ...meta })
}

export const logApiError = (
  error: Error | unknown,
  context?: Record<string, unknown>
) => {
  if (error instanceof Error) {
    logger.error('API Error', {
      message: error.message,
      stack: error.stack,
      ...context,
    })
  } else {
    logger.error('API Error', {
      error: String(error),
      ...context,
    })
  }
}

export const logApiWarning = (message: string, meta?: Record<string, unknown>) => {
  logger.warn(message, meta)
}

export const logDatabaseQuery = (query: string, duration?: number) => {
  logger.debug('Database Query', { query, duration })
}

export const logAuthAttempt = (success: boolean, identifier: string) => {
  logger.info('Auth Attempt', { success, identifier })
}

// Stream for Morgan (HTTP request logger) - can be used later if needed
export const stream = {
  write: (message: string) => {
    logger.info(message.trim())
  },
}

export default logger
