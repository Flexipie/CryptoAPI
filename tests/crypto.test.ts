import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { buildApp } from '../src/server.js';
import { coinGeckoService } from '../src/services/coingecko.js';
import type { FastifyInstance } from 'fastify';

describe('Crypto API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/crypto/popular', () => {
    it('should return popular cryptocurrencies', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/crypto/popular',
      });

      // May return 200 or 503 depending on CoinGecko availability
      expect([200, 503]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const data = JSON.parse(response.payload);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.timestamp).toBeDefined();
      }
    });
  });

  describe('GET /api/v1/crypto/prices', () => {
    it('should return prices for specified cryptocurrencies', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/crypto/prices?ids=bitcoin,ethereum&vs_currencies=usd',
      });

      expect([200, 503]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const data = JSON.parse(response.payload);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      }
    });

    it('should require ids parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/crypto/prices',
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });

    it('should validate empty ids parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/crypto/prices?ids=',
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/v1/crypto/chart/:id', () => {
    it('should return market chart for a cryptocurrency', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/crypto/chart/bitcoin?vs_currency=usd&days=7',
      });

      expect([200, 503]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const data = JSON.parse(response.payload);
        expect(data.success).toBe(true);
        expect(data.data.prices).toBeDefined();
        expect(data.data.market_caps).toBeDefined();
        expect(data.data.total_volumes).toBeDefined();
      }
    });

    it('should validate days parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/crypto/chart/bitcoin?days=999',
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.payload);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/crypto/list', () => {
    it('should return list of supported cryptocurrencies', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/crypto/list',
      });

      expect([200, 503]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const data = JSON.parse(response.payload);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);

        if (data.data.length > 0) {
          expect(data.data[0]).toHaveProperty('id');
          expect(data.data[0]).toHaveProperty('symbol');
          expect(data.data[0]).toHaveProperty('name');
        }
      }
    });
  });

  describe('GET /api/v1/crypto/info/:id', () => {
    it('should return detailed information about a cryptocurrency', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/crypto/info/bitcoin',
      });

      expect([200, 503]).toContain(response.statusCode);

      if (response.statusCode === 200) {
        const data = JSON.parse(response.payload);
        expect(data.success).toBe(true);
        expect(data.data).toBeTypeOf('object');
      }
    });
  });
});