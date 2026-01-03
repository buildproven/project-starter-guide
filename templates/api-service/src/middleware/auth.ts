import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'
import { logger } from '../lib/logger'
import { HttpStatus } from '../constants/http'
import { ErrorCodes } from '../utils/responses'

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization
  if (!authHeader || Array.isArray(authHeader)) {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      error: 'Access token required',
      message: 'Please provide a valid Bearer token in the Authorization header.',
      code: ErrorCodes.AUTH_TOKEN_MISSING,
    })
  }

  const [scheme, token] = authHeader.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(HttpStatus.UNAUTHORIZED).json({
      error: 'Access token required',
      message: 'Please provide a valid Bearer token in the Authorization header.',
      code: ErrorCodes.AUTH_TOKEN_MISSING,
    })
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
      return res.status(HttpStatus.FORBIDDEN).json({
        error: 'Invalid token payload',
        message: 'The provided token does not contain valid user information.',
        code: ErrorCodes.AUTH_TOKEN_INVALID,
      })
    }

    req.userId = userId
    return next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again to continue.',
        code: ErrorCodes.AUTH_TOKEN_EXPIRED,
      })
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        error: 'Invalid token',
        message: 'The provided token is invalid or malformed. Please log in again.',
        code: ErrorCodes.AUTH_TOKEN_INVALID,
      })
    }
    logger.error('[Auth] Unexpected authentication error', {
      error,
      requestId: req.requestId,
    })
    return res.status(HttpStatus.UNAUTHORIZED).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication. Please try again.',
      code: ErrorCodes.AUTH_TOKEN_INVALID,
    })
  }
}
