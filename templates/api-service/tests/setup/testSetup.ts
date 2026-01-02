// Use the same Prisma client instance as the production app
// This ensures database operations are synchronized between tests and app routes
import { beforeAll, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../src/lib/prisma'

beforeAll(async () => {
  // Clean all data before test file starts
  await prisma.user.deleteMany({})
  // Reset auto-increment sequence for SQLite
  await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name='users'`
})

beforeEach(async () => {
  // Clean all data before each test and reset auto-increment
  await prisma.user.deleteMany({})
  // Reset auto-increment sequence for SQLite
  await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name='users'`
})

afterAll(async () => {
  // Disconnect Prisma client after all tests
  await prisma.$disconnect()
})

export { prisma }
