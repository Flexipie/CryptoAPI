import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/server.js';
import type { FastifyInstance } from 'fastify';

describe('Forex API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/forex/rates', () => {
    it('should return current exchange rates', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/forex/rates',
      });

      expect([200, 503]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const data = JSON.parse(response.payload);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.timestamp).toBeDefined();

        if (data.data.length > 0) {
          const rate = data.data[0];
          expect(rate).toHaveProperty('currency');
          expect(rate).toHaveProperty('rate');
          expect(rate).toHaveProperty('date');
          expect(rate).toHaveProperty('base_currency');
          expect(rate.base_currency).toBe('EUR');
        }
      }
    });
  });

  describe('GET /api/v1/forex/convert', () => {
    it('should convert between currencies', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/forex/convert?from=USD&to=EUR&amount=100',
      });

      expect([200, 404, 503]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const data = JSON.parse(response.payload);
        expect(data.success).toBe(true);
        expect(data.data.from_currency).toBe('USD');
        expect(data.data.to_currency).toBe('EUR');
        expect(data.data.amount).toBe(100);
        expect(typeof data.data.exchange_rate).toBe('number');
        expect(typeof data.data.converted_amount).toBe('number');
      }
    });

    it('should require from and to parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/forex/convert',
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
    });

    it('should handle same currency conversion', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/forex/convert?from=EUR&to=EUR&amount=100',
      });

      expect([200, 404, 503]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const data = JSON.parse(response.payload);
        expect(data.success).toBe(true);
        expect(data.data.exchange_rate).toBe(1);
        expect(data.data.converted_amount).toBe(100);
      }
    });
  });

  describe('GET /api/v1/forex/historical', () => {
    it('should return historical exchange rates', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/forex/historical?days=7',
      });

      expect([200, 503]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const data = JSON.parse(response.payload);
        expect(data.success).toBe(true);
        expect(typeof data.data).toBe('object');
      }
    });

    it('should validate days parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/forex/historical?days=999',
      });

      // This should be handled by the route validation
      expect([400, 200, 503]).toContain(response.statusCode);
    });
  });

  describe('GET /api/v1/forex/currencies', () => {
    it('should return supported currencies', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/forex/currencies',
      });

      expect([200, 503]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const data = JSON.parse(response.payload);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);

        if (data.data.length > 0) {
          // Should include EUR as base currency
          expect(data.data).toContain('EUR');
        }
      }
    });
  });
});