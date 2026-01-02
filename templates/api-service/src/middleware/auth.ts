import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { logger } from '../lib/logger'
import { HttpStatus } from '../constants/http'

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  if (!authHeader || Array.isArray(authHeader)) {
    return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Access token required' })
  }

  const [scheme, token] = authHeader.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ['HS256'],
    })
    const userIdCandidate =
      typeof decoded === 'object' && decoded !== null && 'userId' in decoded
        ? (decoded as Record<string, unknown>).userId
        : undefined

    const userId = Number(userIdCandidate)
    if (Number.isNaN(userId)) {
      return res.status(HttpStatus.FORBIDDEN).json({ error: 'Invalid token payload' })
    }

    req.userId = userId
    return next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Token expired' })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Invalid token' })
    }
    logger.error('[Auth] Unexpected authentication error', {
      error,
      requestId: req.requestId,
    })
    return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Authentication failed' })
  }
}
