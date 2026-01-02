import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123',
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('token')
      expect(response.body.user).toHaveProperty('email', userData.email)
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should return 400 for invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'TestPassword123',
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('POST /api/auth/login', () => {
    it('should return 401 for invalid credentials', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('error', 'Invalid credentials')
    })

    it('should return 400 for invalid email format', async () => {
      const credentials = {
        email: 'invalid-email',
        password: 'somepassword',
      }

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('status', 'OK')
      expect(response.body).toHaveProperty('timestamp')
    })
  })
})
