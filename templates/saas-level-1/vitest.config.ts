import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, 'vitest.setup.tsx')],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.tsx', 'src/**/*.ts'],
      exclude: [
        'src/**/*.test.tsx',
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'src/types/**',
        'src/app/layout.tsx', // Next.js infrastructure
        'src/app/providers.tsx', // Next.js infrastructure
        'src/lib/prisma.ts', // DB infrastructure - needs integration tests
        'src/lib/env.ts', // Env validation - uses server-only, tested at runtime
        'src/app/api/**', // API routes - need integration tests
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        statements: 90,
        branches: 85,
      },
    },
    alias: {
      // React 19 compatibility: redirect deprecated react-dom/test-utils to our shim
      'react-dom/test-utils': resolve(__dirname, 'test-utils-shim.ts'),
    },
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
