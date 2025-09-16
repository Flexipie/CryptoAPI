import type { FastifyReply } from 'fastify';
import type { ApiResponse, ErrorResponse } from '../types/index.js';

export function successResponse<T>(
  reply: FastifyReply,
  data: T,
  cacheHit: boolean = false
): FastifyReply {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    cache_hit: cacheHit,
  };

  return reply.send(response);
}

export function errorResponse(
  reply: FastifyReply,
  error: string,
  statusCode: number = 500,
  details?: Record<string, unknown>
): FastifyReply {
  const response: ErrorResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
  };

  return reply.status(statusCode).send(response);
}

export function validationErrorResponse(reply: FastifyReply, validationErrors: any): FastifyReply {
  return errorResponse(reply, 'Validation failed', 400, { validation_errors: validationErrors });
}

export function notFoundResponse(reply: FastifyReply, resource: string = 'Resource'): FastifyReply {
  return errorResponse(reply, `${resource} not found`, 404);
}

export function rateLimitResponse(reply: FastifyReply): FastifyReply {
  return errorResponse(reply, 'Rate limit exceeded. Please try again later.', 429);
}

export function serviceUnavailableResponse(
  reply: FastifyReply,
  service: string = 'External service'
): FastifyReply {
  return errorResponse(reply, `${service} is currently unavailable. Please try again later.`, 503);
}
