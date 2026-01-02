import type { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      userId?: number
    }
  }
}

export type AuthenticatedRequest = Request & { userId?: number }
