import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ecbService } from '../services/ecb.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';

const forexRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get current exchange rates
  fastify.get(
    '/rates',
    {
      schema: {
        description: 'Get current foreign exchange rates (EUR-based)',
        tags: ['forex'],
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
                    currency: { type: 'string' },
                    rate: { type: 'number' },
                    date: { type: 'string' },
                    base_currency: { type: 'string' },
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
        const data = await ecbService.getDailyRates();
        return successResponse(reply, data, false);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch exchange rates');
        return errorResponse(reply, 'Failed to fetch exchange rates', 503);
      }
    }
  );

  // Get cross rate between two currencies
  fastify.get(
    '/convert',
    {
      schema: {
        description: 'Get exchange rate between two currencies',
        tags: ['forex'],
        querystring: {
          type: 'object',
          properties: {
            from: {
              type: 'string',
              description: 'Source currency code (3 letters)',
              minLength: 3,
              maxLength: 3,
            },
            to: {
              type: 'string',
              description: 'Target currency code (3 letters)',
              minLength: 3,
              maxLength: 3,
            },
            amount: {
              type: 'number',
              description: 'Amount to convert',
              default: 1,
              minimum: 0,
            },
          },
          required: ['from', 'to'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  from_currency: { type: 'string' },
                  to_currency: { type: 'string' },
                  exchange_rate: { type: 'number' },
                  amount: { type: 'number' },
                  converted_amount: { type: 'number' },
                  date: { type: 'string' },
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
        const query = request.query as { from: string; to: string; amount?: number };
        const { from, to, amount = 1 } = query;

        if (!from || !to) {
          return errorResponse(reply, 'Both from and to currencies are required', 400);
        }

        const fromUpper = from.toUpperCase();
        const toUpper = to.toUpperCase();

        const exchangeRate = await ecbService.getCrossRate(fromUpper, toUpper);

        if (exchangeRate === null) {
          return errorResponse(
            reply,
            `Exchange rate not available for ${fromUpper}/${toUpper}`,
            404
          );
        }

        const convertedAmount = amount * exchangeRate;
        const rates = await ecbService.getDailyRates();
        const date = rates[0]?.date || new Date().toISOString().split('T')[0];

        const data = {
          from_currency: fromUpper,
          to_currency: toUpper,
          exchange_rate: exchangeRate,
          amount,
          converted_amount: convertedAmount,
          date,
        };

        return successResponse(reply, data, false);
      } catch (error) {
        logger.error({ error }, 'Failed to convert currencies');
        return errorResponse(reply, 'Failed to convert currencies', 503);
      }
    }
  );

  // Get historical exchange rates
  fastify.get(
    '/historical',
    {
      schema: {
        description: 'Get historical exchange rates for the last 90 days',
        tags: ['forex'],
        querystring: {
          type: 'object',
          properties: {
            days: {
              type: 'integer',
              description: 'Number of days of historical data (max 90)',
              default: 90,
              minimum: 1,
              maximum: 90,
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
                additionalProperties: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      currency: { type: 'string' },
                      rate: { type: 'number' },
                      date: { type: 'string' },
                      base_currency: { type: 'string' },
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
        const query = request.query as { days?: number };
        const days = query.days || 90;

        const data = await ecbService.getHistoricalRates(days);
        return successResponse(reply, data, false);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch historical exchange rates');
        return errorResponse(reply, 'Failed to fetch historical exchange rates', 503);
      }
    }
  );

  // Get supported currencies
  fastify.get(
    '/currencies',
    {
      schema: {
        description: 'Get list of supported currencies',
        tags: ['forex'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: { type: 'string' },
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
        const data = await ecbService.getSupportedCurrencies();
        return successResponse(reply, data, false);
      } catch (error) {
        logger.error({ error }, 'Failed to fetch supported currencies');
        return errorResponse(reply, 'Failed to fetch supported currencies', 503);
      }
    }
  );
};

export default forexRoutes;
