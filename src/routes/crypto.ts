import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { coinGeckoService } from '../services/coingecko.js';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/response.js';
import { cryptoPriceQuerySchema, marketChartQuerySchema } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';

const cryptoRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get popular cryptocurrencies
  fastify.get(
    '/popular',
    {
      schema: {
        description: 'Get popular cryptocurrencies with current prices',
        tags: ['crypto'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    symbol: { type: 'string' },
                    name: { type: 'string' },
                    current_price: { type: 'number' },
                    market_cap: { type: ['number', 'null'] },
                    total_volume: { type: ['number', 'null'] },
                    price_change_24h: { type: ['number', 'null'] },
                    price_change_percentage_24h: { type: ['number', 'null'] },
                    last_updated: { type: 'string' },
                    vs_currency: { type: 'string' },
                  },
                },
              },
              timestamp: { type: 'string' },
              cache_hit: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        const data = await coinGeckoService.getPopularCrypto();
        return successResponse(reply, data, false);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch popular cryptocurrencies');
        return errorResponse(reply, 'Failed to fetch popular cryptocurrencies', 503);
      }
    }
  );

  // Get specific cryptocurrency prices
  fastify.get(
    '/prices',
    {
      schema: {
        description: 'Get current prices for specific cryptocurrencies',
        tags: ['crypto'],
        querystring: {
          type: 'object',
          properties: {
            ids: {
              type: 'string',
              description: 'Comma-separated coin IDs (e.g., bitcoin,ethereum)',
            },
            vs_currencies: {
              type: 'string',
              description: 'Comma-separated fiat currencies (e.g., usd,eur)',
              default: 'usd',
            },
          },
          required: ['ids'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    symbol: { type: 'string' },
                    name: { type: 'string' },
                    current_price: { type: 'number' },
                    market_cap: { type: ['number', 'null'] },
                    total_volume: { type: ['number', 'null'] },
                    price_change_24h: { type: ['number', 'null'] },
                    price_change_percentage_24h: { type: ['number', 'null'] },
                    last_updated: { type: 'string' },
                    vs_currency: { type: 'string' },
                  },
                },
              },
              timestamp: { type: 'string' },
              cache_hit: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const query = cryptoPriceQuerySchema.parse(request.query);
        const coinIds = query.ids.split(',').map((id) => id.trim());
        const vsCurrencies = query.vs_currencies.split(',').map((curr) => curr.trim());

        const data = await coinGeckoService.getSimplePrices(coinIds, vsCurrencies);
        return successResponse(reply, data, false);
      } catch (error) {
        if (error instanceof ZodError) {
          return validationErrorResponse(reply, error.errors);
        }
        logger.error({ error }, 'Failed to fetch cryptocurrency prices');
        return errorResponse(reply, 'Failed to fetch cryptocurrency prices', 503);
      }
    }
  );

  // Get market chart for a specific cryptocurrency
  fastify.get(
    '/chart/:id',
    {
      schema: {
        description: 'Get historical market data for a specific cryptocurrency',
        tags: ['crypto'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Coin ID (e.g., bitcoin)' },
          },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            vs_currency: {
              type: 'string',
              description: 'Fiat currency',
              default: 'usd',
            },
            days: {
              type: 'string',
              description: 'Number of days (1-365)',
              default: '7',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  prices: {
                    type: 'array',
                    items: {
                      type: 'array',
                      items: { type: 'number' },
                      minItems: 2,
                      maxItems: 2,
                    },
                  },
                  market_caps: {
                    type: 'array',
                    items: {
                      type: 'array',
                      items: { type: 'number' },
                      minItems: 2,
                      maxItems: 2,
                    },
                  },
                  total_volumes: {
                    type: 'array',
                    items: {
                      type: 'array',
                      items: { type: 'number' },
                      minItems: 2,
                      maxItems: 2,
                    },
                  },
                },
              },
              timestamp: { type: 'string' },
              cache_hit: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const query = marketChartQuerySchema.parse(request.query);

        const data = await coinGeckoService.getMarketChart(
          id,
          query.vs_currency,
          parseInt(query.days)
        );
        return successResponse(reply, data, false);
      } catch (error) {
        if (error instanceof ZodError) {
          return validationErrorResponse(reply, error.errors);
        }
        logger.error({ error }, 'Failed to fetch market chart');
        return errorResponse(reply, 'Failed to fetch market chart', 503);
      }
    }
  );

  // Get coin information
  fastify.get(
    '/info/:id',
    {
      schema: {
        description: 'Get detailed information about a specific cryptocurrency',
        tags: ['crypto'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Coin ID (e.g., bitcoin)' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                additionalProperties: true
              },
              timestamp: { type: 'string' },
              cache_hit: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        logger.info({ id }, 'Fetching coin info for ID');
        const data = await coinGeckoService.getCoinInfo(id);
        logger.info({ id, dataKeys: Object.keys(data || {}), hasData: !!data }, 'Got coin info data');
        return successResponse(reply, data, false);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch coin information');
        return errorResponse(reply, 'Failed to fetch coin information', 503);
      }
    }
  );

  // Get supported coins list
  fastify.get(
    '/list',
    {
      schema: {
        description: 'Get list of all supported cryptocurrencies',
        tags: ['crypto'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    symbol: { type: 'string' },
                    name: { type: 'string' },
                    platforms: { type: 'object' },
                  },
                },
              },
              timestamp: { type: 'string' },
              cache_hit: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        const data = await coinGeckoService.getCoinsList();
        return successResponse(reply, data, false);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch coins list');
        return errorResponse(reply, 'Failed to fetch coins list', 503);
      }
    }
  );
};

export default cryptoRoutes;
