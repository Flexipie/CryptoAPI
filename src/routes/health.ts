import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { cacheService } from '../services/cache.js';
import { coinGeckoService } from '../services/coingecko.js';
import { ecbService } from '../services/ecb.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cache: {
    memoryCache: {
      size: number;
      maxSize: number;
    };
    redis: {
      connected: boolean;
      enabled: boolean;
    };
  };
  services: {
    coingecko: 'available' | 'degraded' | 'unavailable';
    ecb: 'available' | 'degraded' | 'unavailable';
  };
}

const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Basic health check
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Basic health check endpoint',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['healthy'] },
                  timestamp: { type: 'string' },
                  uptime: { type: 'number' },
                },
              },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const data = {
        status: 'healthy' as const,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };

      return successResponse(reply, data);
    }
  );

  // Detailed health check
  fastify.get(
    '/health/detailed',
    {
      schema: {
        description: 'Detailed health check with service status',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                  timestamp: { type: 'string' },
                  uptime: { type: 'number' },
                  memory: {
                    type: 'object',
                    properties: {
                      used: { type: 'number' },
                      total: { type: 'number' },
                      percentage: { type: 'number' },
                    },
                  },
                  cache: {
                    type: 'object',
                    properties: {
                      memoryCache: {
                        type: 'object',
                        properties: {
                          size: { type: 'number' },
                          maxSize: { type: 'number' },
                        },
                      },
                      redis: {
                        type: 'object',
                        properties: {
                          connected: { type: 'boolean' },
                          enabled: { type: 'boolean' },
                        },
                      },
                    },
                  },
                  services: {
                    type: 'object',
                    properties: {
                      coingecko: { type: 'string', enum: ['available', 'degraded', 'unavailable'] },
                      ecb: { type: 'string', enum: ['available', 'degraded', 'unavailable'] },
                    },
                  },
                },
              },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        // Memory usage
        const memUsage = process.memoryUsage();
        const totalMemory = memUsage.heapTotal;
        const usedMemory = memUsage.heapUsed;

        // Cache status
        const cacheStats = cacheService.getStats();

        // Service availability checks
        const [coingeckoStatus, ecbStatus] = await Promise.allSettled([
          checkCoinGeckoHealth(),
          checkECBHealth(),
        ]);

        const services = {
          coingecko:
            coingeckoStatus.status === 'fulfilled'
              ? coingeckoStatus.value
              : ('unavailable' as const),
          ecb: ecbStatus.status === 'fulfilled' ? ecbStatus.value : ('unavailable' as const),
        };

        // Overall health status
        let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

        if (services.coingecko === 'unavailable' || services.ecb === 'unavailable') {
          overallStatus = 'unhealthy';
        } else if (services.coingecko === 'degraded' || services.ecb === 'degraded') {
          overallStatus = 'degraded';
        }

        const healthData: HealthStatus = {
          status: overallStatus,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: {
            used: usedMemory,
            total: totalMemory,
            percentage: (usedMemory / totalMemory) * 100,
          },
          cache: cacheStats,
          services,
        };

        const statusCode =
          overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

        return reply.status(statusCode).send({
          success: true,
          data: healthData,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error({ error }, 'Health check failed');
        return errorResponse(reply, 'Health check failed', 500);
      }
    }
  );

  // Readiness probe
  fastify.get(
    '/ready',
    {
      schema: {
        description: 'Kubernetes readiness probe',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  ready: { type: 'boolean' },
                  timestamp: { type: 'string' },
                },
              },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      // Check if essential services are available
      try {
        const [coingeckoCheck, ecbCheck] = await Promise.allSettled([
          checkCoinGeckoHealth(),
          checkECBHealth(),
        ]);

        const ready =
          coingeckoCheck.status === 'fulfilled' &&
          ecbCheck.status === 'fulfilled' &&
          coingeckoCheck.value !== 'unavailable' &&
          ecbCheck.value !== 'unavailable';

        const data = {
          ready,
          timestamp: new Date().toISOString(),
        };

        const statusCode = ready ? 200 : 503;
        return reply.status(statusCode).send({
          success: true,
          data,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error({ error }, 'Readiness check failed');
        return reply.status(503).send({
          success: false,
          error: 'Service not ready',
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  // Liveness probe
  fastify.get(
    '/live',
    {
      schema: {
        description: 'Kubernetes liveness probe',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  alive: { type: 'boolean' },
                  timestamp: { type: 'string' },
                },
              },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      // Simple liveness check
      const data = {
        alive: true,
        timestamp: new Date().toISOString(),
      };

      return successResponse(reply, data);
    }
  );
};

async function checkCoinGeckoHealth(): Promise<'available' | 'degraded' | 'unavailable'> {
  try {
    // Try to fetch a simple request with timeout
    await coinGeckoService.getSimplePrices(['bitcoin'], ['usd']);
    return 'available';
  } catch (error) {
    logger.warn({ error }, 'CoinGecko health check failed');

    // Check if we have cached data available
    try {
      // This is a lightweight check for cached data
      const cached = await coinGeckoService.getPopularCrypto();
      if (cached && cached.length > 0) {
        return 'degraded';
      }
    } catch {
      // Ignore cache check errors
    }

    return 'unavailable';
  }
}

async function checkECBHealth(): Promise<'available' | 'degraded' | 'unavailable'> {
  try {
    // Try to fetch current rates
    await ecbService.getDailyRates();
    return 'available';
  } catch (error) {
    logger.warn({ error }, 'ECB health check failed');

    // Check if we have cached data available
    try {
      const supportedCurrencies = await ecbService.getSupportedCurrencies();
      if (supportedCurrencies && supportedCurrencies.length > 0) {
        return 'degraded';
      }
    } catch {
      // Ignore cache check errors
    }

    return 'unavailable';
  }
}

export default healthRoutes;
