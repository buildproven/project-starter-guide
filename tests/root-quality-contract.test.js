import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '..')
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))

describe('root quality contract', () => {
  it('uses the root ESLint configuration without loading template-local configs', () => {
    expect(packageJson.scripts.lint).toContain('--config eslint.config.cjs')
  })

  it('leaves template formatting to each generated project', () => {
    expect(packageJson.scripts['format:check']).toContain("'!templates/**'")
  })

  it('uses maintained root audit tooling and has no phantom type-check project', () => {
    expect(packageJson.devDependencies['license-checker-rseidelsohn']).toBeDefined()
    expect(packageJson.devDependencies['@lhci/cli']).toBeUndefined()
    expect(packageJson.devDependencies['license-checker']).toBeUndefined()
    expect(packageJson.scripts['type-check:all']).toBeUndefined()
    expect(packageJson.scripts['type-check:tests']).toBeUndefined()
  })
})
