import type { Response } from 'express'
import { HttpStatus } from '../constants/http'

/**
 * Error Code Definitions
 * Structured error codes for programmatic error handling
 */
export const ErrorCodes = {
  // Authentication errors (1xxx)
  AUTH_TOKEN_MISSING: 'AUTH_1001',
  AUTH_TOKEN_INVALID: 'AUTH_1002',
  AUTH_TOKEN_EXPIRED: 'AUTH_1003',
  AUTH_CREDENTIALS_INVALID: 'AUTH_1004',
  AUTH_USER_NOT_FOUND: 'AUTH_1005',

  // Authorization errors (2xxx)
  AUTHZ_INSUFFICIENT_PERMISSIONS: 'AUTHZ_2001',
  AUTHZ_ROLE_REQUIRED: 'AUTHZ_2002',

  // Validation errors (3xxx)
  VALIDATION_EMAIL_INVALID: 'VALIDATION_3001',
  VALIDATION_PASSWORD_WEAK: 'VALIDATION_3002',
  VALIDATION_REQUIRED_FIELD: 'VALIDATION_3003',
  VALIDATION_URL_INVALID: 'VALIDATION_3004',

  // Resource errors (4xxx)
  RESOURCE_NOT_FOUND: 'RESOURCE_4001',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_4002',
  RESOURCE_CONFLICT: 'RESOURCE_4003',

  // Rate limiting errors (5xxx)
  RATE_LIMIT_EXCEEDED: 'RATE_5001',
  RATE_LIMIT_AUTH_EXCEEDED: 'RATE_5002',

  // External request errors (6xxx)
  EXTERNAL_REQUEST_FAILED: 'EXTERNAL_6001',
  EXTERNAL_REQUEST_TIMEOUT: 'EXTERNAL_6002',
  EXTERNAL_SSRF_BLOCKED: 'EXTERNAL_6003',

  // System errors (9xxx)
  SYSTEM_ERROR: 'SYSTEM_9001',
  DATABASE_ERROR: 'SYSTEM_9002',
} as const

interface ErrorResponse {
  error: string
  message: string
  code?: string
  details?: Record<string, unknown>
}

export const errorResponses = {
  internalError: (res: Response, details?: Record<string, unknown>) =>
    res.status(HttpStatus.INTERNAL_ERROR).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.',
      code: ErrorCodes.SYSTEM_ERROR,
      ...(details && { details }),
    } as ErrorResponse),

  unauthorized: (res: Response, message?: string, code?: string) =>
    res.status(HttpStatus.UNAUTHORIZED).json({
      error: 'Unauthorized',
      message: message || 'Authentication required. Please provide a valid access token.',
      code: code || ErrorCodes.AUTH_TOKEN_MISSING,
    } as ErrorResponse),

  badRequest: (res: Response, message: string, code?: string, details?: Record<string, unknown>) =>
    res.status(HttpStatus.BAD_REQUEST).json({
      error: 'Bad Request',
      message,
      code: code || ErrorCodes.VALIDATION_REQUIRED_FIELD,
      ...(details && { details }),
    } as ErrorResponse),

  notFound: (res: Response, message?: string, code?: string) =>
    res.status(HttpStatus.NOT_FOUND).json({
      error: 'Not Found',
      message: message || 'The requested resource was not found.',
      code: code || ErrorCodes.RESOURCE_NOT_FOUND,
    } as ErrorResponse),

  forbidden: (res: Response, message?: string, code?: string) =>
    res.status(HttpStatus.FORBIDDEN).json({
      error: 'Forbidden',
      message: message || 'You do not have permission to access this resource.',
      code: code || ErrorCodes.AUTHZ_INSUFFICIENT_PERMISSIONS,
    } as ErrorResponse),

  // Specific error helpers for common scenarios
  invalidCredentials: (res: Response) =>
    res.status(HttpStatus.UNAUTHORIZED).json({
      error: 'Invalid credentials',
      message: 'The email or password you entered is incorrect. Please try again.',
      code: ErrorCodes.AUTH_CREDENTIALS_INVALID,
    } as ErrorResponse),

  tokenExpired: (res: Response) =>
    res.status(HttpStatus.UNAUTHORIZED).json({
      error: 'Token expired',
      message: 'Your session has expired. Please log in again.',
      code: ErrorCodes.AUTH_TOKEN_EXPIRED,
    } as ErrorResponse),

  resourceExists: (res: Response, resource: string) =>
    res.status(HttpStatus.BAD_REQUEST).json({
      error: 'Resource already exists',
      message: `A ${resource} with this information already exists.`,
      code: ErrorCodes.RESOURCE_ALREADY_EXISTS,
    } as ErrorResponse),

  validationError: (res: Response, field: string, reason: string) =>
    res.status(HttpStatus.BAD_REQUEST).json({
      error: 'Validation error',
      message: `Invalid ${field}: ${reason}`,
      code: ErrorCodes.VALIDATION_REQUIRED_FIELD,
      details: { field, reason },
    } as ErrorResponse),

  rateLimitExceeded: (res: Response, retryAfter: number) =>
    res.status(HttpStatus.TOO_MANY_REQUESTS).json({
      error: 'Rate limit exceeded',
      message: `You have made too many requests. Please try again in ${retryAfter} seconds.`,
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
      details: { retryAfter },
    } as ErrorResponse),
}

export const successResponses = {
  ok: <T>(res: Response, data: T) => res.status(HttpStatus.OK).json(data),

  created: <T>(res: Response, data: T) => res.status(HttpStatus.CREATED).json(data),
}
