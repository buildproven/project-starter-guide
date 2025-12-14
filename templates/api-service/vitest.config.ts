import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    root: '.',
    include: ['tests/unit/**/*.test.ts', 'tests/smoke/**/*.test.ts'],
    exclude: ['tests/integration/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/index.ts',
        'src/config/env.ts',
        'src/middleware/errorHandler.ts',
        'src/middleware/ssrfProtection.ts',
        'src/controllers/authController.ts',
        'src/lib/logger.ts',
        'src/lib/prisma.ts', // Infrastructure code - tested via integration tests
      ],
      thresholds: {
        branches: 65,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
