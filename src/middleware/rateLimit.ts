import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from './auth.js';
import { logger } from '../utils/logger.js';

// In-memory rate limit store (use Redis in production)
interface RateLimitData {
  count: number;
  resetTime: number;
  dailyCount: number;
  dailyResetTime: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  dailyMaxRequests: number;
  burstLimit: number;
  keyGenerator: (request: FastifyRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export function createAdaptiveRateLimit() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest;

    // Get user's plan limits
    if (!authRequest.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required for rate limiting',
        timestamp: new Date().toISOString()
      });
    }

    const plan = authRequest.user.plan;

    // Generate rate limit key
    const key = authRequest.user.isAnonymous
      ? `anon:${request.ip}`
      : `user:${authRequest.user.userId}`;

    const now = Date.now();
    const hourlyWindow = 60 * 60 * 1000; // 1 hour
    const dailyWindow = 24 * 60 * 60 * 1000; // 24 hours

    // Get or create rate limit data
    let data = rateLimitStore.get(key);
    if (!data) {
      data = {
        count: 0,
        resetTime: now + hourlyWindow,
        dailyCount: 0,
        dailyResetTime: now + dailyWindow
      };
      rateLimitStore.set(key, data);
    }

    // Reset hourly counter if window expired
    if (now > data.resetTime) {
      data.count = 0;
      data.resetTime = now + hourlyWindow;
    }

    // Reset daily counter if window expired
    if (now > data.dailyResetTime) {
      data.dailyCount = 0;
      data.dailyResetTime = now + dailyWindow;
    }

    // Check hourly limit
    if (data.count >= plan.requestsPerHour) {
      const resetIn = Math.ceil((data.resetTime - now) / 1000);

      logger.warn({
        userId: authRequest.user.userId,
        plan: plan.tier,
        hourlyCount: data.count,
        hourlyLimit: plan.requestsPerHour
      }, 'Hourly rate limit exceeded');

      return reply.status(429).send({
        success: false,
        error: 'Hourly rate limit exceeded',
        timestamp: new Date().toISOString(),
        details: {
          type: 'HOURLY_RATE_LIMIT_EXCEEDED',
          limit: plan.requestsPerHour,
          window: 'hour',
          current_usage: data.count,
          reset_in_seconds: resetIn,
          reset_time: new Date(data.resetTime).toISOString(),
          plan: plan.tier,
          upgrade_info: getUpgradeMessage(plan.tier)
        }
      });
    }

    // Check daily limit
    if (data.dailyCount >= plan.requestsPerDay) {
      const resetIn = Math.ceil((data.dailyResetTime - now) / 1000);

      logger.warn({
        userId: authRequest.user.userId,
        plan: plan.tier,
        dailyCount: data.dailyCount,
        dailyLimit: plan.requestsPerDay
      }, 'Daily rate limit exceeded');

      return reply.status(429).send({
        success: false,
        error: 'Daily rate limit exceeded',
        timestamp: new Date().toISOString(),
        details: {
          type: 'DAILY_RATE_LIMIT_EXCEEDED',
          limit: plan.requestsPerDay,
          window: 'day',
          current_usage: data.dailyCount,
          reset_in_seconds: resetIn,
          reset_time: new Date(data.dailyResetTime).toISOString(),
          plan: plan.tier,
          upgrade_info: getUpgradeMessage(plan.tier)
        }
      });
    }

    // Increment counters
    data.count++;
    data.dailyCount++;

    // Add rate limit headers
    reply.headers({
      'X-RateLimit-Limit-Hourly': plan.requestsPerHour.toString(),
      'X-RateLimit-Remaining-Hourly': Math.max(0, plan.requestsPerHour - data.count).toString(),
      'X-RateLimit-Reset-Hourly': new Date(data.resetTime).toISOString(),
      'X-RateLimit-Limit-Daily': plan.requestsPerDay.toString(),
      'X-RateLimit-Remaining-Daily': Math.max(0, plan.requestsPerDay - data.dailyCount).toString(),
      'X-RateLimit-Reset-Daily': new Date(data.dailyResetTime).toISOString(),
      'X-RateLimit-Plan': plan.tier
    });

    // Log usage for analytics
    if (data.count % 10 === 0 || data.dailyCount % 100 === 0) {
      logger.info({
        userId: authRequest.user.userId,
        plan: plan.tier,
        hourlyUsage: data.count,
        dailyUsage: data.dailyCount,
        endpoint: request.url
      }, 'Rate limit usage milestone');
    }
  };
}

export function createBurstRateLimit() {
  const burstStore = new Map<string, { count: number; resetTime: number }>();

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest;

    if (!authRequest.user) {
      return;
    }

    const plan = authRequest.user.plan;

    const key = authRequest.user.isAnonymous
      ? `burst:anon:${request.ip}`
      : `burst:user:${authRequest.user.userId}`;

    const now = Date.now();
    const burstWindow = 60 * 1000; // 1 minute window

    let burstData = burstStore.get(key);
    if (!burstData) {
      burstData = {
        count: 0,
        resetTime: now + burstWindow
      };
      burstStore.set(key, burstData);
    }

    // Reset if window expired
    if (now > burstData.resetTime) {
      burstData.count = 0;
      burstData.resetTime = now + burstWindow;
    }

    // Check burst limit
    if (burstData.count >= plan.burstLimit) {
      const resetIn = Math.ceil((burstData.resetTime - now) / 1000);

      logger.warn({
        userId: authRequest.user.userId,
        plan: plan.tier,
        burstCount: burstData.count,
        burstLimit: plan.burstLimit
      }, 'Burst rate limit exceeded');

      return reply.status(429).send({
        success: false,
        error: 'Too many requests in short time period',
        timestamp: new Date().toISOString(),
        details: {
          type: 'BURST_RATE_LIMIT_EXCEEDED',
          limit: plan.burstLimit,
          window: 'minute',
          current_usage: burstData.count,
          reset_in_seconds: resetIn,
          message: 'Please slow down your request rate'
        }
      });
    }

    burstData.count++;

    // Add burst limit headers
    reply.headers({
      'X-RateLimit-Burst-Limit': plan.burstLimit.toString(),
      'X-RateLimit-Burst-Remaining': Math.max(0, plan.burstLimit - burstData.count).toString(),
      'X-RateLimit-Burst-Reset': new Date(burstData.resetTime).toISOString()
    });
  };
}

function getUpgradeMessage(currentTier: string): string {
  switch (currentTier) {
    case 'free':
      return 'Upgrade to Basic plan ($5/mo) for 10,000 requests/month and higher limits';
    case 'basic':
      return 'Upgrade to Pro plan ($20/mo) for 100,000 requests/month and premium features';
    case 'pro':
      return 'Upgrade to Ultra plan ($50/mo) for 500,000 requests/month and enterprise features';
    default:
      return 'Contact support for custom enterprise plans with higher limits';
  }
}

// Cleanup function to remove expired entries
export function cleanupRateLimitStore() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, data] of rateLimitStore.entries()) {
    // Remove entries that are expired for more than 1 hour
    if (now > data.resetTime + (60 * 60 * 1000) && now > data.dailyResetTime + (60 * 60 * 1000)) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info({ cleanedEntries: cleaned }, 'Cleaned up expired rate limit entries');
  }
}

// Schedule cleanup every hour
setInterval(cleanupRateLimitStore, 60 * 60 * 1000);

// Get rate limit info for a user (useful for analytics)
export function getRateLimitInfo(userId: string): RateLimitData | null {
  return rateLimitStore.get(`user:${userId}`) || null;
}

// Reset rate limits for a user (admin function)
export function resetUserRateLimit(userId: string): boolean {
  const key = `user:${userId}`;
  if (rateLimitStore.has(key)) {
    rateLimitStore.delete(key);
    logger.info({ userId }, 'Reset user rate limits');
    return true;
  }
  return false;
}