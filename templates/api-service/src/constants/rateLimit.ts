export const RateLimits = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  GLOBAL_MAX: 100,
  AUTH_MAX: 5,
  REGISTRATION_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  REGISTRATION_MAX: 3,
} as const
