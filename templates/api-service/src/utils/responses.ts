import type { Response } from 'express'
import { HttpStatus } from '../constants/http'

export const errorResponses = {
  internalError: (res: Response) => res.status(HttpStatus.INTERNAL_ERROR).json({ error: 'Internal server error' }),

  unauthorized: (res: Response, message = 'Unauthorized') =>
    res.status(HttpStatus.UNAUTHORIZED).json({ error: message }),

  badRequest: (res: Response, message: string) =>
    res.status(HttpStatus.BAD_REQUEST).json({ error: message }),

  notFound: (res: Response, message = 'Not found') =>
    res.status(HttpStatus.NOT_FOUND).json({ error: message }),

  forbidden: (res: Response, message = 'Forbidden') =>
    res.status(HttpStatus.FORBIDDEN).json({ error: message }),
}

export const successResponses = {
  ok: <T>(res: Response, data: T) => res.status(HttpStatus.OK).json(data),

  created: <T>(res: Response, data: T) => res.status(HttpStatus.CREATED).json(data),
}
