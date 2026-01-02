// IMPORTANT: Load environment variables FIRST, before any other imports
// This ensures Prisma and other modules can access process.env at initialization
import dotenv from 'dotenv'
dotenv.config()

// Validate environment variables early - fails fast if invalid
import { env } from './config/env'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { requestLogger, logger } from './lib/logger'

import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'
import { globalLimiter } from './middleware/rateLimiting'
import authRoutes from './routes/auth'
import healthRoutes from './routes/health'
import fetchRoutes from './routes/fetch'

const app = express()

// Trust proxy only when explicitly enabled (prevents spoofed X-Forwarded-For)
app.set('trust proxy', env.TRUST_PROXY)

// Security middleware with explicit CSP directives
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'], // Removed permissive 'https:' - add specific domains if needed
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Allow cross-origin requests for API use cases
  })
)
const corsOptions =
  env.CORS_ORIGIN === '*'
    ? { origin: '*', credentials: false }
    : { origin: env.CORS_ORIGIN, credentials: true }

// Warn about wildcard CORS in development
if (env.CORS_ORIGIN === '*' && env.NODE_ENV !== 'production') {
  logger.warn('CORS_ORIGIN is set to "*" - this disables CORS protection!')
  logger.warn('Only use wildcard CORS in development. Set specific origin in production.')
}

app.use(cors(corsOptions))

// Rate limiting (global)
app.use(globalLimiter)

// Logging
app.use(requestLogger)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.use('/health', healthRoutes)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api', fetchRoutes)

// Error handling
app.use(notFound)
app.use(errorHandler)

export default app
