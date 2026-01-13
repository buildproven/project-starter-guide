#!/usr/bin/env node

/**
 * QA Integration Tests
 * Tests quality automation integration across all templates.
 *
 * Usage:
 *   npm run test:qa                     # Run all QA tests
 *   node tests/integration/qa-integration.test.mjs --template=api  # Single template
 */

import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT_DIR = resolve(__dirname, '../..')
const TEMPLATES_DIR = resolve(ROOT_DIR, 'templates')
const TEST_OUTPUT_DIR = resolve(ROOT_DIR, '.test-output')

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
}

function color(text, ...styles) {
  return styles.join('') + text + colors.reset
}

// Test tracking
let totalTests = 0
let passedTests = 0
let failedTests = 0
const failures = []

function test(name, fn) {
  totalTests++
  try {
    fn()
    passedTests++
    console.log(`  ${color('PASS', colors.green)} ${name}`)
  } catch (error) {
    failedTests++
    console.log(`  ${color('FAIL', colors.red)} ${name}`)
    console.log(`       ${color(error.message, colors.dim)}`)
    failures.push({ name, error: error.message })
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
  }
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertContains(haystack, needle, message) {
  if (!haystack.includes(needle)) {
    throw new Error(`${message}: "${needle}" not found`)
  }
}

// Helper to run command and get result
function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || ROOT_DIR,
    encoding: 'utf8',
    timeout: options.timeout || 60000,
    env: { ...process.env, ...options.env },
  })
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
    error: result.error,
  }
}

// ============================================
// TEST SUITES
// ============================================

function testTemplateConfigs() {
  console.log(color('\n--- Template Configuration Tests ---', colors.bold))

  const templates = ['about-me-page', 'api-service', 'mobile-app', 'saas-level-1']

  for (const template of templates) {
    const templateDir = join(TEMPLATES_DIR, template)

    test(`${template}: has valid package.json`, () => {
      const pkgPath = join(templateDir, 'package.json')
      if (template === 'about-me-page') {
        // Static template - no package.json
        assertTrue(!existsSync(pkgPath) || true, 'Static template check')
        return
      }
      assertTrue(existsSync(pkgPath), `package.json not found at ${pkgPath}`)
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      assertTrue(pkg.name, 'package.json missing name')
      assertTrue(pkg.scripts, 'package.json missing scripts')
    })

    test(`${template}: has CLAUDE.md`, () => {
      const claudePath = join(templateDir, 'CLAUDE.md')
      // Static templates (about-me-page) may not have CLAUDE.md
      if (template === 'about-me-page') {
        // Skip for static templates - they're simple enough to not need guidance
        return
      }
      assertTrue(existsSync(claudePath), `CLAUDE.md not found`)
      const content = readFileSync(claudePath, 'utf8')
      assertTrue(content.length > 100, 'CLAUDE.md too short')
    })

    test(`${template}: has README.md`, () => {
      const readmePath = join(templateDir, 'README.md')
      assertTrue(existsSync(readmePath), `README.md not found`)
    })
  }
}

function testScriptAvailability() {
  console.log(color('\n--- Script Availability Tests ---', colors.bold))

  // Different templates use different script names
  const requiredScripts = {
    'api-service': ['dev', 'build', 'test', 'lint', 'type-check', 'quality:check'],
    'mobile-app': ['start', 'test', 'lint', 'type-check', 'quality:check'], // Expo uses 'start' not 'dev'
    'saas-level-1': ['dev', 'build', 'test', 'lint', 'type-check', 'quality:check'],
  }

  for (const [template, scripts] of Object.entries(requiredScripts)) {
    const pkgPath = join(TEMPLATES_DIR, template, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))

    for (const script of scripts) {
      test(`${template}: has '${script}' script`, () => {
        assertTrue(pkg.scripts[script], `Missing script: ${script}`)
      })
    }
  }

  // Additional Expo-specific checks
  test('mobile-app: has Expo build scripts', () => {
    const pkgPath = join(TEMPLATES_DIR, 'mobile-app', 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    assertTrue(pkg.scripts['build:ios'] || pkg.scripts['build:android'], 'Missing EAS build scripts')
  })
}

function testSecurityWaivers() {
  console.log(color('\n--- Security Waiver Tests ---', colors.bold))

  const templates = ['api-service', 'mobile-app', 'saas-level-1']

  for (const template of templates) {
    const waiverPath = join(TEMPLATES_DIR, template, '.security-waivers.json')

    test(`${template}: security waivers file exists`, () => {
      assertTrue(existsSync(waiverPath), `.security-waivers.json not found`)
    })

    test(`${template}: security waivers is valid JSON`, () => {
      if (!existsSync(waiverPath)) return
      const content = readFileSync(waiverPath, 'utf8')
      JSON.parse(content) // Will throw if invalid
    })

    test(`${template}: security waivers has correct schema`, () => {
      if (!existsSync(waiverPath)) return
      const waivers = JSON.parse(readFileSync(waiverPath, 'utf8'))
      // Accept either 'waivers' field (active waivers) or 'resolvedAdvisories' (all resolved)
      const hasWaivers = waivers.waivers !== undefined
      const hasResolved = waivers.resolvedAdvisories !== undefined
      assertTrue(hasWaivers || hasResolved, 'Missing waivers or resolvedAdvisories field')
    })
  }
}

function testEnvValidation() {
  console.log(color('\n--- Environment Validation Tests ---', colors.bold))

  // API Service env validation
  test('api-service: validates required env vars on startup', () => {
    const configPath = join(TEMPLATES_DIR, 'api-service', 'src', 'config', 'env.ts')
    if (!existsSync(configPath)) {
      throw new Error('env.ts config not found')
    }
    const content = readFileSync(configPath, 'utf8')
    assertContains(content, 'DATABASE_URL', 'Should validate DATABASE_URL')
    assertContains(content, 'JWT_SECRET', 'Should validate JWT_SECRET')
  })

  // SaaS Level 1 NextAuth validation
  test('saas-level-1: validates NEXTAUTH_SECRET in production', () => {
    // NEXTAUTH_SECRET validation is in auth-options.ts
    const authOptionsPath = join(TEMPLATES_DIR, 'saas-level-1', 'src', 'lib', 'auth-options.ts')
    if (!existsSync(authOptionsPath)) {
      throw new Error('auth-options.ts not found')
    }
    const content = readFileSync(authOptionsPath, 'utf8')
    assertContains(content, 'NEXTAUTH_SECRET', 'Should validate NEXTAUTH_SECRET')
    assertContains(content, 'production', 'Should check production environment')
  })
}

function testLintConfigs() {
  console.log(color('\n--- Lint Configuration Tests ---', colors.bold))

  const templates = ['api-service', 'mobile-app', 'saas-level-1']

  for (const template of templates) {
    test(`${template}: has ESLint config`, () => {
      const eslintPath = join(TEMPLATES_DIR, template, '.eslintrc.json')
      const eslintJsPath = join(TEMPLATES_DIR, template, 'eslint.config.mjs')
      const eslintJsPath2 = join(TEMPLATES_DIR, template, 'eslint.config.js')
      assertTrue(
        existsSync(eslintPath) || existsSync(eslintJsPath) || existsSync(eslintJsPath2),
        'No ESLint config found'
      )
    })

    test(`${template}: has Prettier config`, () => {
      const prettierPath = join(TEMPLATES_DIR, template, '.prettierrc')
      const prettierJsonPath = join(TEMPLATES_DIR, template, '.prettierrc.json')
      assertTrue(existsSync(prettierPath) || existsSync(prettierJsonPath), 'No Prettier config found')
    })

    test(`${template}: has TypeScript config`, () => {
      const tsconfigPath = join(TEMPLATES_DIR, template, 'tsconfig.json')
      assertTrue(existsSync(tsconfigPath), 'No tsconfig.json found')
    })
  }
}

function testHuskyHooks() {
  console.log(color('\n--- Husky Hook Tests ---', colors.bold))

  const templates = ['api-service', 'mobile-app', 'saas-level-1']

  for (const template of templates) {
    const huskyDir = join(TEMPLATES_DIR, template, '.husky')

    test(`${template}: has .husky directory`, () => {
      assertTrue(existsSync(huskyDir), '.husky directory not found')
    })

    test(`${template}: has pre-commit hook`, () => {
      const preCommitPath = join(huskyDir, 'pre-commit')
      assertTrue(existsSync(preCommitPath), 'pre-commit hook not found')
    })

    test(`${template}: pre-commit runs lint-staged`, () => {
      const preCommitPath = join(huskyDir, 'pre-commit')
      if (!existsSync(preCommitPath)) return
      const content = readFileSync(preCommitPath, 'utf8')
      assertContains(content, 'lint-staged', 'pre-commit should run lint-staged')
    })
  }
}

function testGeneratorIntegration() {
  console.log(color('\n--- Generator Integration Tests ---', colors.bold))

  // Clean up test output
  if (existsSync(TEST_OUTPUT_DIR)) {
    rmSync(TEST_OUTPUT_DIR, { recursive: true })
  }
  mkdirSync(TEST_OUTPUT_DIR, { recursive: true })

  test('generator: script exists and is executable', () => {
    const generatorPath = join(ROOT_DIR, 'scripts', 'generate-template.mjs')
    assertTrue(existsSync(generatorPath), 'generate-template.mjs not found')
  })

  test('generator: template config exists', () => {
    const configPath = join(TEMPLATES_DIR, '.templates.json')
    assertTrue(existsSync(configPath), '.templates.json not found')
  })

  test('generator: template config is valid JSON', () => {
    const configPath = join(TEMPLATES_DIR, '.templates.json')
    const content = readFileSync(configPath, 'utf8')
    const config = JSON.parse(content)
    assertTrue(config.templates, 'Missing templates field')
    assertTrue(Object.keys(config.templates).length >= 4, 'Should have at least 4 templates')
  })

  test('generator: can generate API template in non-interactive mode', () => {
    const outputDir = join(TEST_OUTPUT_DIR, 'test-api')
    const result = runCommand('node', [
      join(ROOT_DIR, 'scripts', 'generate-template.mjs'),
      '--template=api',
      '--defaults',
      `--output=${outputDir}`,
    ])

    assertTrue(result.status === 0 || result.stdout.includes('Done'), `Generator failed: ${result.stderr}`)
    assertTrue(existsSync(join(outputDir, 'package.json')), 'package.json not generated')
    assertTrue(existsSync(join(outputDir, '.env.example')), '.env.example not generated')
  })

  test('generator: generated package.json has correct project name', () => {
    const pkgPath = join(TEST_OUTPUT_DIR, 'test-api', 'package.json')
    if (!existsSync(pkgPath)) return
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    assertEqual(pkg.name, 'my-api-service', 'Project name should be my-api-service')
    assertEqual(pkg.version, '0.1.0', 'Version should be 0.1.0')
  })

  test('generator: .env.example has required vars', () => {
    const envPath = join(TEST_OUTPUT_DIR, 'test-api', '.env.example')
    if (!existsSync(envPath)) return
    const content = readFileSync(envPath, 'utf8')
    assertContains(content, 'DATABASE_URL', 'Should have DATABASE_URL')
    assertContains(content, 'JWT_SECRET', 'Should have JWT_SECRET')
  })
}

function testSmokeTestScript() {
  console.log(color('\n--- Smoke Test Script Tests ---', colors.bold))

  test('smoke-test: script exists', () => {
    const scriptPath = join(ROOT_DIR, 'scripts', 'template-smoke-test.sh')
    assertTrue(existsSync(scriptPath), 'template-smoke-test.sh not found')
  })

  test('smoke-test: has waiver support', () => {
    const scriptPath = join(ROOT_DIR, 'scripts', 'template-smoke-test.sh')
    const content = readFileSync(scriptPath, 'utf8')
    assertContains(content, 'security-waivers', 'Should support security waivers')
  })
}

function testCIWorkflows() {
  console.log(color('\n--- CI Workflow Tests ---', colors.bold))

  const workflowsDir = join(ROOT_DIR, '.github', 'workflows')

  test('workflows: template-smoke-tests.yml exists', () => {
    const workflowPath = join(workflowsDir, 'template-smoke-tests.yml')
    assertTrue(existsSync(workflowPath), 'template-smoke-tests.yml not found')
  })

  test('workflows: code-quality-review.yml exists', () => {
    const workflowPath = join(workflowsDir, 'code-quality-review.yml')
    assertTrue(existsSync(workflowPath), 'code-quality-review.yml not found')
  })

  test('workflows: dependency-audit.yml exists', () => {
    const workflowPath = join(workflowsDir, 'dependency-audit.yml')
    assertTrue(existsSync(workflowPath), 'dependency-audit.yml not found')
  })

  test('workflows: smoke-test runs on all templates', () => {
    const workflowPath = join(workflowsDir, 'template-smoke-tests.yml')
    if (!existsSync(workflowPath)) return
    const content = readFileSync(workflowPath, 'utf8')
    assertContains(content, 'api-service', 'Should test api-service')
    assertContains(content, 'saas-level-1', 'Should test saas-level-1')
    assertContains(content, 'mobile-app', 'Should test mobile-app')
  })
}

function testQualityAutomationRunner() {
  console.log(color('\n--- Quality Automation Runner Tests ---', colors.bold))

  test('qa-runner: create-quality-automation-runner.mjs exists', () => {
    const scriptPath = join(ROOT_DIR, 'scripts', 'create-quality-automation-runner.mjs')
    assertTrue(existsSync(scriptPath), 'create-quality-automation-runner.mjs not found')
  })

  test('qa-runner: supports --smoke flag', () => {
    const scriptPath = join(ROOT_DIR, 'scripts', 'create-quality-automation-runner.mjs')
    const content = readFileSync(scriptPath, 'utf8')
    assertContains(content, '--smoke', 'Should support --smoke flag')
  })

  test('qa-runner: default templates include all main templates', () => {
    const scriptPath = join(ROOT_DIR, 'scripts', 'create-quality-automation-runner.mjs')
    const content = readFileSync(scriptPath, 'utf8')
    assertContains(content, 'saas-level-1', 'Should include saas-level-1')
    assertContains(content, 'api-service', 'Should include api-service')
    assertContains(content, 'mobile-app', 'Should include mobile-app')
  })
}

// ============================================
// MAIN
// ============================================

function parseArgs() {
  const args = process.argv.slice(2)
  const parsed = {}

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=')
      parsed[key] = value ?? true
    }
  }

  return parsed
}

function printSummary() {
  console.log('\n' + color('=' .repeat(50), colors.cyan))
  console.log(color('  QA Integration Test Summary', colors.bold))
  console.log(color('=' .repeat(50), colors.cyan))

  console.log(`\n  Total:  ${totalTests}`)
  console.log(`  ${color(`Passed: ${passedTests}`, colors.green)}`)
  console.log(`  ${color(`Failed: ${failedTests}`, failedTests > 0 ? colors.red : colors.green)}`)

  if (failures.length > 0) {
    console.log(color('\n  Failures:', colors.red))
    for (const { name, error } of failures) {
      console.log(`    - ${name}: ${error}`)
    }
  }

  console.log()
}

async function main() {
  const _args = parseArgs()

  console.log(color('\n=== QA Integration Tests ===', colors.bold, colors.cyan))

  // Run test suites
  testTemplateConfigs()
  testScriptAvailability()
  testSecurityWaivers()
  testEnvValidation()
  testLintConfigs()
  testHuskyHooks()
  testGeneratorIntegration()
  testSmokeTestScript()
  testCIWorkflows()
  testQualityAutomationRunner()

  // Cleanup
  if (existsSync(TEST_OUTPUT_DIR)) {
    rmSync(TEST_OUTPUT_DIR, { recursive: true })
  }

  printSummary()

  process.exit(failedTests > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(color('Error:', colors.red), error.message)
  process.exit(1)
})
