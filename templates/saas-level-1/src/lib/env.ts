/**
 * Environment Variable Validation with Zod
 *
 * Server-only module - validates all required environment variables at startup.
 * Fails fast with helpful error messages.
 *
 * Usage (server components/API routes only):
 *   import { env } from '@/lib/env'
 *   console.log(env.DATABASE_URL)
 *
 * WARNING: Never import this in client components - it contains secrets!
 */

import 'server-only'
import { z } from 'zod'

const envSchema = z.object({
  // Node environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Database
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (url) =>
        url.startsWith('postgresql://') ||
        url.startsWith('postgres://') ||
        url.startsWith('file:'), // Allow SQLite for testing
      'DATABASE_URL must be a valid PostgreSQL or SQLite connection string'
    ),

  // NextAuth - always required, no defaults
  NEXTAUTH_SECRET: z
    .string()
    .min(1, 'NEXTAUTH_SECRET is required')
    .refine(
      (secret) => {
        // In production, require strong secret
        if (process.env.NODE_ENV === 'production') {
          return secret.length >= 32
        }
        return true
      },
      'NEXTAUTH_SECRET must be at least 32 characters in production'
    ),

  NEXTAUTH_URL: z
    .string()
    .url('NEXTAUTH_URL must be a valid URL')
    .optional(),

  // Stripe - always required, no defaults (secrets should never have placeholders)
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, 'STRIPE_SECRET_KEY is required')
    .refine(
      (key) => key.startsWith('sk_'),
      'STRIPE_SECRET_KEY must start with sk_'
    ),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required')
    .refine(
      (key) => key.startsWith('whsec_'),
      'STRIPE_WEBHOOK_SECRET must start with whsec_'
    ),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is required')
    .refine(
      (key) => key.startsWith('pk_'),
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_'
    ),

  // Optional: Email (for NextAuth email provider)
  EMAIL_SERVER: z.string().optional(),
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z
    .string()
    .optional()
    .refine(
      (value) => value === undefined || (!Number.isNaN(Number(value)) && Number(value) > 0),
      'EMAIL_SERVER_PORT must be a valid port number'
    ),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Optional: OAuth providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),
})

// Type for validated environment
export type Env = z.infer<typeof envSchema>

/**
 * Validate environment variables
 * Always fails fast - no silent fallbacks for secrets
 */
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    console.error('❌ Invalid environment variables:')
    console.error(JSON.stringify(errors, null, 2))
    console.error('')
    console.error('💡 Hint: Copy .env.example to .env and fill in required values')

    // Always fail fast - secrets should never have placeholders
    throw new Error(
      `Missing or invalid environment variables: ${Object.keys(errors).join(', ')}`
    )
  }

  if (parsed.data.NODE_ENV === 'production' && !parsed.data.NEXTAUTH_URL) {
    throw new Error('NEXTAUTH_URL is required in production')
  }

  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Environment variables validated')
  }
  return parsed.data
}

/**
 * Validated environment variables
 * Import this instead of using process.env directly
 */
export const env = validateEnv()

/**
 * Check if running in production
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * Check if running in development
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Check if running in test
 */
export const isTest = env.NODE_ENV === 'test'
