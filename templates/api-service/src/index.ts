import app from './app'
import { env } from './config/env'
import { logger } from './lib/logger'

// Validation happens on import - fails fast if env vars are invalid

// Only start server when this file is run directly (not imported by tests)
if (require.main === module) {
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`)
    logger.info(`Environment: ${env.NODE_ENV}`)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${env.PORT} is already in use`, { error: err })
    } else if (err.code === 'EACCES') {
      logger.error(`Permission denied for port ${env.PORT}`, { error: err })
    } else {
      logger.error('Server failed to start', { error: err })
    }
    process.exit(1)
  })
}

export default app
