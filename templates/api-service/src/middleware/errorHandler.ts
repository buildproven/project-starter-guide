import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'
import { HttpStatus } from '../constants/http'

export const errorHandler = (
  err: Error & {
    statusCode?: number
    code?: string
    errors?: Record<string, { message: string }>
  },
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isProduction = process.env.NODE_ENV === 'production'
  // Default error response
  let errorResponse = {
    message: err.message,
    statusCode:
      err.statusCode || (res.statusCode !== HttpStatus.OK ? res.statusCode : HttpStatus.INTERNAL_ERROR),
  }

  // Log error
  logger.error('Unhandled error', {
    error: err,
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  })

  // Prisma validation error
  if (err.name === 'PrismaClientValidationError') {
    const message = 'Invalid data provided'
    errorResponse = { message, statusCode: HttpStatus.BAD_REQUEST }
  }

  // Prisma unique constraint violation
  if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
    const message = 'Duplicate field value entered'
    errorResponse = { message, statusCode: HttpStatus.BAD_REQUEST }
  }

  // Prisma record not found
  if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
    const message = 'Resource not found'
    errorResponse = { message, statusCode: HttpStatus.NOT_FOUND }
  }

  const statusCode = errorResponse.statusCode || HttpStatus.INTERNAL_ERROR
  const message =
    statusCode >= HttpStatus.INTERNAL_ERROR && isProduction
      ? 'Internal server error'
      : errorResponse.message

  res.status(statusCode).json({
    success: false,
    error: message || 'Server Error',
  })
}
