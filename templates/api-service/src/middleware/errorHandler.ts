import { Request, Response, NextFunction } from 'express'

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
      err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500),
  }

  // Log error
  console.error(err)

  // Prisma validation error
  if (err.name === 'PrismaClientValidationError') {
    const message = 'Invalid data provided'
    errorResponse = { message, statusCode: 400 }
  }

  // Prisma unique constraint violation
  if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2002') {
    const message = 'Duplicate field value entered'
    errorResponse = { message, statusCode: 400 }
  }

  // Prisma record not found
  if (err.name === 'PrismaClientKnownRequestError' && err.code === 'P2025') {
    const message = 'Resource not found'
    errorResponse = { message, statusCode: 404 }
  }

  const statusCode = errorResponse.statusCode || 500
  const message =
    statusCode >= 500 && isProduction
      ? 'Internal server error'
      : errorResponse.message

  res.status(statusCode).json({
    success: false,
    error: message || 'Server Error',
  })
}
