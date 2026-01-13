import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.{js,mjs,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['tests/**/*.{js,mjs,ts,tsx}'],
      exclude: ['tests/**/*.test.{js,mjs,ts,tsx}'],
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 60,
        statements: 70,
      },
    },
  },
})
