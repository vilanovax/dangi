import { z } from 'zod'

/**
 * Environment Variables Schema
 * Validates all required and optional environment variables at startup
 */
const envSchema = z.object({
  // ─────────────────────────────────────────────────────────────
  // Node Environment
  // ─────────────────────────────────────────────────────────────
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // ─────────────────────────────────────────────────────────────
  // Database
  // ─────────────────────────────────────────────────────────────
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid URL')
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a PostgreSQL connection string'
    ),

  // ─────────────────────────────────────────────────────────────
  // JWT Authentication
  // ─────────────────────────────────────────────────────────────
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security')
    .regex(
      /^[A-Za-z0-9+/=_-]+$/,
      'JWT_SECRET should only contain alphanumeric characters and +-_/='
    ),

  // ─────────────────────────────────────────────────────────────
  // S3-Compatible Storage (Optional)
  // ─────────────────────────────────────────────────────────────
  S3_ENDPOINT: z
    .string()
    .url('S3_ENDPOINT must be a valid URL')
    .optional(),

  S3_BUCKET: z
    .string()
    .min(1, 'S3_BUCKET cannot be empty')
    .optional(),

  S3_ACCESS_KEY: z
    .string()
    .min(1, 'S3_ACCESS_KEY cannot be empty')
    .optional(),

  S3_SECRET_KEY: z
    .string()
    .min(1, 'S3_SECRET_KEY cannot be empty')
    .optional(),

  S3_REGION: z
    .string()
    .default('us-east-1')
    .optional(),

  // ─────────────────────────────────────────────────────────────
  // App Configuration
  // ─────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url('NEXT_PUBLIC_APP_URL must be a valid URL')
    .optional(),

  // ─────────────────────────────────────────────────────────────
  // Logging
  // ─────────────────────────────────────────────────────────────
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'])
    .default('info')
    .optional(),

  // ─────────────────────────────────────────────────────────────
  // Rate Limiting (Optional - for production with Redis)
  // ─────────────────────────────────────────────────────────────
  UPSTASH_REDIS_REST_URL: z
    .string()
    .url('UPSTASH_REDIS_REST_URL must be a valid URL')
    .optional(),

  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(1, 'UPSTASH_REDIS_REST_TOKEN cannot be empty')
    .optional(),
})

// ─────────────────────────────────────────────────────────────
// Type Definition
// ─────────────────────────────────────────────────────────────
export type Env = z.infer<typeof envSchema>

/**
 * Validate Environment Variables
 * Called at application startup
 */
function validateEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env)

    // Additional validation: S3 credentials should be all-or-nothing
    if (parsed.S3_ENDPOINT || parsed.S3_BUCKET || parsed.S3_ACCESS_KEY || parsed.S3_SECRET_KEY) {
      if (!parsed.S3_ENDPOINT || !parsed.S3_BUCKET || !parsed.S3_ACCESS_KEY || !parsed.S3_SECRET_KEY) {
        throw new Error(
          'If any S3 configuration is provided, all S3 variables (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY) must be set'
        )
      }
    }

    // Additional validation: Redis credentials should be all-or-nothing
    if (parsed.UPSTASH_REDIS_REST_URL || parsed.UPSTASH_REDIS_REST_TOKEN) {
      if (!parsed.UPSTASH_REDIS_REST_URL || !parsed.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error(
          'If any Redis configuration is provided, both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set'
        )
      }
    }

    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `  ❌ ${err.path.join('.')}: ${err.message}`)
        .join('\n')

      throw new Error(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Invalid Environment Variables
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${errorMessages}

Please check your .env file and ensure all required variables are set correctly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    }
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// Validate and Export
// ─────────────────────────────────────────────────────────────
export const env = validateEnv()

/**
 * Helper to check if S3 is configured
 */
export const isS3Configured = (): boolean => {
  return !!(
    env.S3_ENDPOINT &&
    env.S3_BUCKET &&
    env.S3_ACCESS_KEY &&
    env.S3_SECRET_KEY
  )
}

/**
 * Helper to check if Redis is configured
 */
export const isRedisConfigured = (): boolean => {
  return !!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
}

/**
 * Helper to check if running in production
 */
export const isProduction = (): boolean => {
  return env.NODE_ENV === 'production'
}

/**
 * Helper to check if running in development
 */
export const isDevelopment = (): boolean => {
  return env.NODE_ENV === 'development'
}

/**
 * Helper to check if running in test
 */
export const isTest = (): boolean => {
  return env.NODE_ENV === 'test'
}
