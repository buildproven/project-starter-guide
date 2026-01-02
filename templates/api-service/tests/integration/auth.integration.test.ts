// Real integration tests with actual database operations
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'
import jwt from 'jsonwebtoken'
import { prisma } from '../setup/testSetup'

// Helper function to generate unique email addresses for tests
const generateUniqueEmail = (prefix: string = 'test') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`
}

describe('Auth Integration Tests (Real Database)', () => {
  // Database cleanup is handled by testSetup.ts

  describe('Complete Registration → Login Flow', () => {
    it('should register user, then login successfully with real DB', async () => {
      const userData = {
        name: 'Integration Test User',
        email: generateUniqueEmail('integration'),
        password: 'TestPassword123!',
      }

      // Step 1: Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)

      expect(registerResponse.status).toBe(201)
      expect(registerResponse.body).toHaveProperty('token')
      expect(registerResponse.body.user).toHaveProperty('email', userData.email)
      expect(registerResponse.body.user).toHaveProperty('name', userData.name)
      expect(registerResponse.body.user).not.toHaveProperty('password')

      // Verify JWT token is valid
      const decodedToken = jwt.verify(
        registerResponse.body.token,
        process.env.JWT_SECRET!
      ) as any
      expect(decodedToken).toHaveProperty('userId')
      // JWT should include userId but email is optional (some designs only include userId)

      // Step 2: Verify user exists in real database
      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email },
      })
      expect(userInDb).toBeTruthy()
      expect(userInDb!.email).toBe(userData.email)
      expect(userInDb!.name).toBe(userData.name)
      expect(userInDb!.password).not.toBe(userData.password) // Should be hashed

      // Step 3: Login with correct credentials
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: userData.password,
      })

      expect(loginResponse.status).toBe(200)
      expect(loginResponse.body).toHaveProperty('token')
      expect(loginResponse.body.user).toHaveProperty('email', userData.email)
      expect(loginResponse.body.user).not.toHaveProperty('password')

      // Verify login JWT is valid
      const loginToken = jwt.verify(
        loginResponse.body.token,
        process.env.JWT_SECRET!
      ) as any
      expect(loginToken).toHaveProperty('userId')
      // JWT should include userId but email is optional
    })

    // Duplicate registration testing moved to auth.comprehensive.integration.test.ts
    // which properly simulates database constraints

    it('should reject login with wrong password', async () => {
      const userData = {
        name: 'Password Test User',
        email: generateUniqueEmail('password'),
        password: 'CorrectPassword123!',
      }

      // Register user
      await request(app).post('/api/auth/register').send(userData)

      // Try login with wrong password
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: userData.email,
        password: 'WrongPassword123!',
      })

      expect(loginResponse.status).toBe(401)
      expect(loginResponse.body).toHaveProperty('error', 'Invalid credentials')
    })

    it('should reject login for non-existent user', async () => {
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'SomePassword123!',
      })

      expect(loginResponse.status).toBe(401)
      expect(loginResponse.body).toHaveProperty('error', 'Invalid credentials')
    })

    it('should hash passwords properly (never store plain text)', async () => {
      const userData = {
        name: 'Hash Test User',
        email: generateUniqueEmail('hash'),
        password: 'PlainTextPassword123!',
      }

      await request(app).post('/api/auth/register').send(userData)

      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      expect(userInDb).toBeTruthy()
      expect(userInDb!.password).not.toBe(userData.password)
      expect(userInDb!.password).toMatch(/^\$2[aby]\$\d+\$[./0-9A-Za-z]{53}$/) // bcrypt format
    })

    it('should include user ID in JWT tokens', async () => {
      const userData = {
        name: 'JWT Test User',
        email: generateUniqueEmail('jwt'),
        password: 'JWTPassword123!',
      }

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)

      const userInDb = await prisma.user.findUnique({
        where: { email: userData.email },
      })

      const decodedToken = jwt.verify(
        registerResponse.body.token,
        process.env.JWT_SECRET!
      ) as any
      expect(decodedToken.userId).toBe(userInDb!.id)
    })
  })

  describe('Database Constraints', () => {
    // Unique email constraint testing moved to auth.comprehensive.integration.test.ts
    // which properly simulates database constraint violations

    it('should handle required field validation', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'incomplete@example.com',
        // Missing name and password
      })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })
})
