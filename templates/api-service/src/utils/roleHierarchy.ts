/**
 * Role Hierarchy Utilities
 *
 * Provides centralized role comparison and permission checking logic.
 * Eliminates scattered role comparisons throughout the codebase.
 *
 * Role Hierarchy (highest to lowest):
 * ADMIN > MODERATOR > USER
 *
 * Features:
 * - Type-safe role operations
 * - Centralized hierarchy definition
 * - Easy to extend with new roles
 * - Maintainable permission logic
 */

// Import Role enum from Prisma (will be available after prisma generate)
import { Role } from '@prisma/client'

/**
 * Role hierarchy levels (higher number = more permissions)
 */
const ROLE_LEVELS: Record<Role, number> = {
  USER: 1,
  MODERATOR: 2,
  ADMIN: 3,
}

/**
 * Check if a user has at least the specified role level
 * @example hasMinimumRole('MODERATOR', 'ADMIN') // true (ADMIN >= MODERATOR)
 * @example hasMinimumRole('ADMIN', 'USER') // false (USER < ADMIN)
 */
export function hasMinimumRole(requiredRole: Role, userRole: Role): boolean {
  return ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole]
}

/**
 * Check if a user has exactly the specified role
 */
export function hasExactRole(requiredRole: Role, userRole: Role): boolean {
  return userRole === requiredRole
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(allowedRoles: Role[], userRole: Role): boolean {
  return allowedRoles.includes(userRole)
}

/**
 * Check if a user is an admin
 */
export function isAdmin(userRole: Role): boolean {
  return userRole === Role.ADMIN
}

/**
 * Check if a user is a moderator or higher
 */
export function isModerator(userRole: Role): boolean {
  return hasMinimumRole(Role.MODERATOR, userRole)
}

/**
 * Check if a user is a regular user (not moderator or admin)
 */
export function isRegularUser(userRole: Role): boolean {
  return userRole === Role.USER
}

/**
 * Get all roles at or below a given level
 * @example getRolesAtOrBelow('MODERATOR') // ['USER', 'MODERATOR']
 */
export function getRolesAtOrBelow(maxRole: Role): Role[] {
  const maxLevel = ROLE_LEVELS[maxRole]
  return Object.entries(ROLE_LEVELS)
    .filter(([, level]) => level <= maxLevel)
    .map(([role]) => role as Role)
}

/**
 * Get all roles above a given level
 * @example getRolesAbove('USER') // ['MODERATOR', 'ADMIN']
 */
export function getRolesAbove(minRole: Role): Role[] {
  const minLevel = ROLE_LEVELS[minRole]
  return Object.entries(ROLE_LEVELS)
    .filter(([, level]) => level > minLevel)
    .map(([role]) => role as Role)
}

/**
 * Compare two roles and return the higher one
 */
export function getHigherRole(role1: Role, role2: Role): Role {
  return ROLE_LEVELS[role1] >= ROLE_LEVELS[role2] ? role1 : role2
}

/**
 * Get role display name (for UI)
 */
export function getRoleDisplayName(role: Role): string {
  return role.charAt(0) + role.slice(1).toLowerCase()
}

/**
 * Validate role transition (e.g., can a USER be promoted to ADMIN?)
 * Returns true if the transition is allowed
 */
export function canTransitionRole(
  fromRole: Role,
  toRole: Role,
  actorRole: Role
): boolean {
  // Only admins can change roles
  if (!isAdmin(actorRole)) {
    return false
  }

  // Can't demote an admin (prevent lockout)
  if (fromRole === Role.ADMIN) {
    return false
  }

  return true
}
