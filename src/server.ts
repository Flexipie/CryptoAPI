import Fastify from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';

import { appConfig } from './utils/config.js';
import { logger } from './utils/logger.js';
import { cacheService } from './services/cache.js';

import { authenticateRequest } from './middleware/auth.js';
import { createAdaptiveRateLimit, createBurstRateLimit } from './middleware/rateLimit.js';

import cryptoRoutes from './routes/crypto.js';
import forexRoutes from './routes/forex.js';
import healthRoutes from './routes/health.js';
import portfolioRoutes from './routes/portfolio.js';

export async function buildApp() {
  const fastify = Fastify({
    logger: logger as any,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
      },
    },
  });

  // Security middleware
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'unpkg.com'],
        scriptSrc: ["'self'", 'unpkg.com'],
        imgSrc: ["'self'", 'data:', 'unpkg.com'],
      },
    },
  });

  // CORS
  await fastify.register(fastifyCors, {
    origin: (origin, callback) => {
      const hostname = new URL(origin || 'http://localhost').hostname;

      // Allow localhost and common development hosts
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
        callback(null, true);
        return;
      }

      // In production, be more restrictive
      if (appConfig.NODE_ENV === 'production') {
        // Add your production domains here
        const allowedOrigins = [
          'https://rapidapi.com',
          'https://api.rapidapi.com',
        ];
        callback(null, allowedOrigins.includes(origin || ''));
        return;
      }

      // Allow everything in development
      callback(null, true);
    },
  });

  // Authentication middleware (must come before rate limiting)
  fastify.addHook('preHandler', authenticateRequest);

  // Adaptive rate limiting based on subscription plans
  fastify.addHook('preHandler', createAdaptiveRateLimit());

  // Burst protection
  fastify.addHook('preHandler', createBurstRateLimit());

  // Swagger/OpenAPI documentation
  await fastify.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'Crypto + FX Market API',
        description: 'Production-ready API aggregating crypto market data from CoinGecko and fiat FX rates from ECB',
        version: '1.0.0',
        contact: {
          name: 'API Support',
        },
        license: {
          name: 'MIT',
        },
      },
      host: appConfig.NODE_ENV === 'production'
        ? 'crypto-fx-api.rapidapi.com'
        : `localhost:${appConfig.PORT}`,
      schemes: appConfig.NODE_ENV === 'production' ? ['https'] : ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'crypto', description: 'Cryptocurrency market data endpoints' },
        { name: 'forex', description: 'Foreign exchange rate endpoints' },
        { name: 'health', description: 'Health check and monitoring endpoints' },
      ],
      definitions: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            error: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            details: { type: 'object' },
          },
          required: ['success', 'error', 'timestamp'],
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
            cache_hit: { type: 'boolean' },
          },
          required: ['success', 'data', 'timestamp'],
        },
      },
    },
    hideUntagged: true,
  });

  await fastify.register(fastifySwaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'full',
      deepLinking: false,
    },
    uiHooks: {
      onRequest: function (_request, _reply, next) {
        next();
      },
      preHandler: function (_request, _reply, next) {
        next();
      },
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    transformSpecification: (swaggerObject, _request, _reply) => {
      return swaggerObject;
    },
    transformSpecificationClone: true,
  });

  // API Routes
  await fastify.register(cryptoRoutes, { prefix: '/api/v1/crypto' });
  await fastify.register(forexRoutes, { prefix: '/api/v1/forex' });
  await fastify.register(portfolioRoutes, { prefix: '/api/v1/portfolio' });
  await fastify.register(healthRoutes, { prefix: '/api/v1' });

  // Root endpoint
  fastify.get('/', async (_request, _reply) => {
    return {
      name: 'Crypto + FX Market API',
      version: '1.0.0',
      description: 'Production-ready API aggregating crypto market data and fiat FX rates',
      docs: '/docs',
      health: '/api/v1/health',
      endpoints: {
        crypto: '/api/v1/crypto',
        forex: '/api/v1/forex',
        portfolio: '/api/v1/portfolio',
      },
      authentication: {
        required: false,
        api_key_header: 'X-API-Key',
        demo_keys: {
          free: 'demo_free_key',
          basic: 'demo_basic_key',
          pro: 'demo_pro_key'
        }
      },
      timestamp: new Date().toISOString(),
    };
  });

  // Global error handler
  fastify.setErrorHandler(async (error, request, reply) => {
    logger.error({ error, url: request.url, method: request.method }, 'Request failed');

    // Rate limit errors
    if (error.statusCode === 429) {
      return reply.status(429).send({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        timestamp: new Date().toISOString(),
      });
    }

    // Validation errors
    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        timestamp: new Date().toISOString(),
        details: {
          validation_errors: error.validation,
        },
      });
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    const message = statusCode === 500
      ? 'Internal server error'
      : error.message;

    return reply.status(statusCode).send({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  fastify.setNotFoundHandler(async (request, reply) => {
    return reply.status(404).send({
      success: false,
      error: 'Endpoint not found',
      timestamp: new Date().toISOString(),
      details: {
        url: request.url,
        method: request.method,
        available_endpoints: {
          docs: '/docs',
          health: '/api/v1/health',
          crypto: '/api/v1/crypto',
          forex: '/api/v1/forex',
        },
      },
    });
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal, closing server...');

    try {
      await cacheService.disconnect();
      await fastify.close();
      logger.info('Server closed successfully');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return fastify;
}

export async function startServer() {
  try {
    const server = await buildApp();

    await server.listen({
      port: appConfig.PORT,
      host: '0.0.0.0',
    });

    logger.info({
      port: appConfig.PORT,
      env: appConfig.NODE_ENV,
      docs: `http://localhost:${appConfig.PORT}/docs`,
    }, 'Server started successfully');

    return server;
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}