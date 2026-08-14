import { describe, expect, it } from 'vitest'
import { assertProductionProviders, isValidAuthSecret } from '@/lib/auth-policy'

describe('Auth Route Bootstrap', () => {
  it('rejects production startup without a configured provider', () => {
    expect(() => assertProductionProviders('production', 0)).toThrow(
      'No authentication providers configured in production'
    )
  })

  it('allows development fallback and configured production providers', () => {
    expect(() => assertProductionProviders('development', 0)).not.toThrow()
    expect(() => assertProductionProviders('production', 1)).not.toThrow()
  })

  it('requires a 32-character production secret', () => {
    expect(isValidAuthSecret('production', 'short')).toBe(false)
    expect(isValidAuthSecret('production', 'x'.repeat(32))).toBe(true)
    expect(isValidAuthSecret('development', 'short')).toBe(true)
  })
})
