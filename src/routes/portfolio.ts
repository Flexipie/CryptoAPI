import { FastifyInstance, FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { portfolioService } from '../services/portfolio.js';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/response.js';
import { logger } from '../utils/logger.js';
import { checkFeatureAccess, AuthenticatedRequest } from '../middleware/auth.js';

const portfolioRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Calculate portfolio value
  fastify.post(
    '/calculate',
    {
      preHandler: [checkFeatureAccess('portfolio_basic')],
      schema: {
        description: 'Calculate portfolio total value and asset breakdown',
        tags: ['portfolio'],
        body: {
          type: 'object',
          properties: {
            holdings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Coin ID (e.g., bitcoin)' },
                  amount: { type: 'number', description: 'Amount held' },
                  cost_basis: { type: 'number', description: 'Optional: cost per coin' },
                  purchase_date: { type: 'string', description: 'Optional: purchase date' }
                },
                required: ['id', 'amount'],
                additionalProperties: false
              },
              minItems: 1,
              maxItems: 500
            },
            base_currency: {
              type: 'string',
              description: 'Currency for calculations',
              default: 'usd',
              enum: ['usd', 'eur', 'btc', 'eth']
            }
          },
          required: ['holdings'],
          additionalProperties: false
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  summary: {
                    type: 'object',
                    properties: {
                      total_value: { type: 'number' },
                      total_cost: { type: 'number' },
                      total_profit_loss: { type: 'number' },
                      total_profit_loss_percentage: { type: 'number' },
                      asset_count: { type: 'number' },
                      base_currency: { type: 'string' },
                      last_updated: { type: 'string' }
                    },
                    additionalProperties: false
                  },
                  assets: {
                    type: 'array',
                    items: {
                      type: 'object',
                      additionalProperties: true
                    }
                  },
                  performance: {
                    type: 'object',
                    additionalProperties: true
                  }
                },
                additionalProperties: false
              },
              timestamp: { type: 'string' },
              cache_hit: { type: 'boolean' }
            },
            additionalProperties: false
          }
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authRequest = request as AuthenticatedRequest;

        logger.info({
          userId: authRequest.user?.userId,
          plan: authRequest.user?.plan.tier
        }, 'Portfolio calculation request');

        const portfolioRequest = portfolioService.validatePortfolioRequest(request.body);
        const result = await portfolioService.calculatePortfolio(portfolioRequest);

        return successResponse(reply, result, false);
      } catch (error) {
        if (error instanceof ZodError) {
          return validationErrorResponse(reply, error.errors);
        }
        logger.error({ error }, 'Failed to calculate portfolio');
        return errorResponse(reply, (error as Error).message, 400);
      }
    }
  );

  // Get portfolio allocation breakdown
  fastify.post(
    '/allocation',
    {
      preHandler: [checkFeatureAccess('portfolio_basic')],
      schema: {
        description: 'Get portfolio allocation and diversification analysis',
        tags: ['portfolio'],
        body: {
          type: 'object',
          properties: {
            holdings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  amount: { type: 'number' },
                  cost_basis: { type: 'number' },
                  purchase_date: { type: 'string' }
                },
                required: ['id', 'amount'],
                additionalProperties: false
              },
              minItems: 1,
              maxItems: 500
            },
            base_currency: {
              type: 'string',
              default: 'usd',
              enum: ['usd', 'eur', 'btc', 'eth']
            }
          },
          required: ['holdings'],
          additionalProperties: false
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  allocation: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        symbol: { type: 'string' },
                        percentage: { type: 'number' },
                        value: { type: 'number' }
                      },
                      additionalProperties: false
                    }
                  },
                  diversification_score: { type: 'number' },
                  risk_level: { type: 'string', enum: ['low', 'medium', 'high'] }
                },
                additionalProperties: false
              },
              timestamp: { type: 'string' },
              cache_hit: { type: 'boolean' }
            },
            additionalProperties: false
          }
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authRequest = request as AuthenticatedRequest;

        logger.info({
          userId: authRequest.user?.userId,
          plan: authRequest.user?.plan.tier
        }, 'Portfolio allocation request');

        const portfolioRequest = portfolioService.validatePortfolioRequest(request.body);
        const result = await portfolioService.getPortfolioAllocation(portfolioRequest);

        return successResponse(reply, result, false);
      } catch (error) {
        if (error instanceof ZodError) {
          return validationErrorResponse(reply, error.errors);
        }
        logger.error({ error }, 'Failed to calculate portfolio allocation');
        return errorResponse(reply, (error as Error).message, 400);
      }
    }
  );

  // Historical performance (Pro feature placeholder)
  fastify.post(
    '/performance',
    {
      preHandler: [checkFeatureAccess('portfolio_advanced')],
      schema: {
        description: 'Get historical portfolio performance (Pro feature)',
        tags: ['portfolio'],
        body: {
          type: 'object',
          properties: {
            holdings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  amount: { type: 'number' },
                  cost_basis: { type: 'number' },
                  purchase_date: { type: 'string' }
                },
                required: ['id', 'amount'],
                additionalProperties: false
              }
            },
            base_currency: { type: 'string', default: 'usd' },
            days: { type: 'number', default: 30, minimum: 1, maximum: 365 }
          },
          required: ['holdings'],
          additionalProperties: false
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authRequest = request as AuthenticatedRequest;

        logger.info({
          userId: authRequest.user?.userId,
          plan: authRequest.user?.plan.tier
        }, 'Portfolio performance request');

        const body = request.body as any;
        const portfolioRequest = portfolioService.validatePortfolioRequest(body);
        const days = body.days || 30;

        const result = await portfolioService.getHistoricalPerformance(portfolioRequest, days);

        return successResponse(reply, result, false);
      } catch (error) {
        logger.error({ error }, 'Failed to get portfolio performance');
        return errorResponse(reply, (error as Error).message, 400);
      }
    }
  );

  // Simple portfolio value endpoint for quick calculations
  fastify.post(
    '/value',
    {
      preHandler: [checkFeatureAccess('portfolio_basic')],
      schema: {
        description: 'Quick portfolio value calculation (summary only)',
        tags: ['portfolio'],
        body: {
          type: 'object',
          properties: {
            holdings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  amount: { type: 'number' }
                },
                required: ['id', 'amount'],
                additionalProperties: false
              },
              minItems: 1,
              maxItems: 100
            },
            base_currency: { type: 'string', default: 'usd' }
          },
          required: ['holdings'],
          additionalProperties: false
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const portfolioRequest = portfolioService.validatePortfolioRequest(request.body);
        const result = await portfolioService.calculatePortfolio(portfolioRequest);

        // Return only summary for quick value checks
        return successResponse(reply, {
          total_value: result.summary.total_value,
          asset_count: result.summary.asset_count,
          base_currency: result.summary.base_currency,
          last_updated: result.summary.last_updated
        }, false);
      } catch (error) {
        logger.error({ error }, 'Failed to calculate portfolio value');
        return errorResponse(reply, (error as Error).message, 400);
      }
    }
  );
};

export default portfolioRoutes;