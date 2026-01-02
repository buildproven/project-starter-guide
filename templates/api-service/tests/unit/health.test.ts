import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/app'

describe('Health endpoints', () => {
  describe('GET /health', () => {
    it('returns OK status with environment metadata', async () => {
      const response = await request(app).get('/health')

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        status: 'OK',
        environment: expect.any(String),
      })
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
      expect(response.body).toHaveProperty('version')
    })
  })

  describe('GET /health/ready', () => {
    it('returns readiness status with dependency checks', async () => {
      const response = await request(app).get('/health/ready')

      expect([200, 503]).toContain(response.status)
      expect(response.body).toHaveProperty('status')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('checks')
      expect(response.body.checks).toHaveProperty('database')
      expect(response.body.checks.database).toHaveProperty('status')
      expect(response.body.checks.database).toHaveProperty('latency')
      expect(response.body).toHaveProperty('metrics')
      expect(response.body.metrics).toHaveProperty('totalLatency')
      expect(response.body.metrics).toHaveProperty('uptime')
    })

    it('includes database connectivity check', async () => {
      const response = await request(app).get('/health/ready')

      expect(response.body.checks.database).toMatchObject({
        status: expect.stringMatching(/^(healthy|unhealthy)$/),
        latency: expect.any(Number),
      })
    })
  })

  describe('GET /health/metrics', () => {
    it('returns application metrics', async () => {
      const response = await request(app).get('/health/metrics')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
      expect(response.body).toHaveProperty('memory')
      expect(response.body.memory).toHaveProperty('rss')
      expect(response.body.memory).toHaveProperty('heapTotal')
      expect(response.body.memory).toHaveProperty('heapUsed')
      expect(response.body).toHaveProperty('cpu')
      expect(response.body).toHaveProperty('nodejs')
      expect(response.body).toHaveProperty('environment')
      expect(response.body).toHaveProperty('version')
    })
  })
})
