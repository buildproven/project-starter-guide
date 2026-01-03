/**
 * Role-Based Authorization Middleware
 *
 * Provides middleware for protecting routes based on user roles.
 * Uses centralized role hierarchy utilities for consistent permission checks.
 *
 * Usage:
 * - requireRole(Role.ADMIN) - Exact role match
 * - requireMinimumRole(Role.MODERATOR) - Moderator or higher
 * - requireAnyRole([Role.ADMIN, Role.MODERATOR]) - Any of the listed roles
 */

import { Request, Response, NextFunction } from 'express'
import { Role } from '@prisma/client'
import { hasMinimumRole, hasExactRole, hasAnyRole } from '../utils/roleHierarchy'
import { prisma } from '../lib/prisma'
import { HttpStatus } from '../constants/http'
import { errorResponses } from '../utils/responses'

// Extend Express Request to include userId from auth middleware
interface AuthenticatedRequest extends Request {
  userId?: number
  userRole?: Role
}

/**
 * Middleware to require exact role match
 */
export function requireRole(requiredRole: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest

    if (!authReq.userId) {
      return errorResponses.unauthorized(res, 'Authentication required')
    }

    // Fetch user role if not already in request
    if (!authReq.userRole) {
      const user = await prisma.user.findUnique({
        where: { id: authReq.userId },
        select: { role: true },
      })

      if (!user) {
        return errorResponses.unauthorized(res, 'User not found')
      }

      authReq.userRole = user.role
    }

    if (!hasExactRole(requiredRole, authReq.userRole)) {
      return res.status(HttpStatus.FORBIDDEN).json({
        error: 'Insufficient permissions',
        message: `This action requires ${requiredRole} role`,
      })
    }

    return next()
  }
}

/**
 * Middleware to require minimum role level
 */
export function requireMinimumRole(minimumRole: Role) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest

    if (!authReq.userId) {
      return errorResponses.unauthorized(res, 'Authentication required')
    }

    // Fetch user role if not already in request
    if (!authReq.userRole) {
      const user = await prisma.user.findUnique({
        where: { id: authReq.userId },
        select: { role: true },
      })

      if (!user) {
        return errorResponses.unauthorized(res, 'User not found')
      }

      authReq.userRole = user.role
    }

    if (!hasMinimumRole(minimumRole, authReq.userRole)) {
      return res.status(HttpStatus.FORBIDDEN).json({
        error: 'Insufficient permissions',
        message: `This action requires at least ${minimumRole} role`,
      })
    }

    return next()
  }
}

/**
 * Middleware to require any of the specified roles
 */
export function requireAnyRole(allowedRoles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest

    if (!authReq.userId) {
      return errorResponses.unauthorized(res, 'Authentication required')
    }

    // Fetch user role if not already in request
    if (!authReq.userRole) {
      const user = await prisma.user.findUnique({
        where: { id: authReq.userId },
        select: { role: true },
      })

      if (!user) {
        return errorResponses.unauthorized(res, 'User not found')
      }

      authReq.userRole = user.role
    }

    if (!hasAnyRole(allowedRoles, authReq.userRole)) {
      return res.status(HttpStatus.FORBIDDEN).json({
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      })
    }

    return next()
  }
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole(Role.ADMIN)

/**
 * Middleware to require moderator or admin role
 */
export const requireModerator = requireMinimumRole(Role.MODERATOR)
