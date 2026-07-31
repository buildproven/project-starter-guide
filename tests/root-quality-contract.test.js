import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const packageJson = JSON.parse(
  readFileSync(resolve(root, 'package.json'), 'utf8')
)
const eslintConfig = readFileSync(resolve(root, 'eslint.config.cjs'), 'utf8')
const smartTestStrategy = readFileSync(
  resolve(root, 'scripts/smart-test-strategy.sh'),
  'utf8'
)

describe('root quality contract', () => {
  it('uses the root ESLint configuration without loading template-local configs', () => {
    expect(packageJson.scripts.lint).toContain('--config eslint.config.cjs')
    expect(eslintConfig).toContain('**/templates/**/eslint.config.*')
    expect(eslintConfig).toContain("'n/no-missing-require': 'off'")
  })

  it('leaves template formatting to each generated project', () => {
    expect(packageJson.scripts['format:check']).toContain("'!templates/**'")
  })

  it('uses maintained root audit tooling and has no phantom type-check project', () => {
    expect(packageJson.engines.node).toBe('>=24')
    expect(packageJson.engines.npm).toBe('>=11.0.0')
    expect(
      packageJson.devDependencies['license-checker-rseidelsohn']
    ).toBeDefined()
    expect(packageJson.devDependencies['@lhci/cli']).toBeUndefined()
    expect(packageJson.devDependencies['license-checker']).toBeUndefined()
    expect(packageJson.scripts['type-check:all']).toBeUndefined()
    expect(packageJson.scripts['type-check:tests']).toBeUndefined()
    expect(packageJson.scripts['test:fast']).not.toContain('--reporter=basic')
    expect(packageJson.scripts['test:medium']).not.toContain('--reporter=basic')
  })

  it('does not run medium-test fallbacks after a successful test command', () => {
    expect(smartTestStrategy).toContain(
      'npm run test:medium 2>/dev/null || (npm run lint && npm run spell:check --if-present)'
    )
  })

  it('keeps staged JavaScript linting on the root ESLint boundary', () => {
    expect(packageJson['lint-staged']['**/*.{js,jsx,mjs,cjs,html}']).toContain(
      'eslint --config eslint.config.cjs --fix'
    )
  })
})
