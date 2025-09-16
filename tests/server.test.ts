import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/server.js';
import type { FastifyInstance } from 'fastify';

describe('Server', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Root endpoint', () => {
    it('should return API information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.name).toBe('Crypto + FX Market API');
      expect(data.version).toBe('1.0.0');
      expect(data.docs).toBe('/docs');
    });
  });

  describe('Health endpoints', () => {
    it('should return healthy status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('healthy');
      expect(data.data.uptime).toBeTypeOf('number');
    });

    it('should return detailed health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health/detailed',
      });

      expect([200, 503]).toContain(response.statusCode);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.data.status);
      expect(data.data.memory).toBeDefined();
      expect(data.data.cache).toBeDefined();
      expect(data.data.services).toBeDefined();
    });

    it('should return liveness status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/live',
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(true);
      expect(data.data.alive).toBe(true);
    });
  });

  describe('404 handling', () => {
    it('should handle non-existent routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Endpoint not found');
      expect(data.details.available_endpoints).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/v1/health',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
        },
      });

      expect(response.statusCode).toBe(204);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });
  });

  describe('Rate limiting', () => {
    it('should not rate limit under normal usage', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });
});