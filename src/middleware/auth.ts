import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger.js';

// Subscription tiers with their features
export interface SubscriptionPlan {
  tier: 'free' | 'basic' | 'pro' | 'ultra';
  requestsPerDay: number;
  requestsPerHour: number;
  burstLimit: number;
  historicalDays: number;
  batchSize: number;
  features: string[];
  priority: number;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    tier: 'free',
    requestsPerDay: 100,
    requestsPerHour: 25,
    burstLimit: 5,
    historicalDays: 7,
    batchSize: 5,
    features: ['basic_data'],
    priority: 1
  },
  basic: {
    tier: 'basic',
    requestsPerDay: 333, // ~10k/month
    requestsPerHour: 50,
    burstLimit: 15,
    historicalDays: 90,
    batchSize: 25,
    features: ['basic_data', 'portfolio_basic', 'historical_extended'],
    priority: 2
  },
  pro: {
    tier: 'pro',
    requestsPerDay: 3333, // ~100k/month
    requestsPerHour: 200,
    burstLimit: 50,
    historicalDays: 365,
    batchSize: 100,
    features: ['basic_data', 'portfolio_basic', 'portfolio_advanced', 'historical_extended', 'technical_indicators'],
    priority: 3
  },
  ultra: {
    tier: 'ultra',
    requestsPerDay: 16666, // ~500k/month
    requestsPerHour: 1000,
    burstLimit: 200,
    historicalDays: 1095, // 3 years
    batchSize: 500,
    features: ['all', 'webhooks', 'alerts', 'custom_integrations'],
    priority: 4
  }
};

// In-memory API key store (in production, use Redis/database)
interface ApiKeyData {
  key: string;
  userId: string;
  plan: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
}

// Simple in-memory store for demo (replace with database in production)
const API_KEYS = new Map<string, ApiKeyData>();

// Initialize some demo API keys for testing
API_KEYS.set('demo_free_key', {
  key: 'demo_free_key',
  userId: 'demo_user_free',
  plan: 'free',
  isActive: true,
  createdAt: new Date(),
  usageCount: 0
});

API_KEYS.set('demo_basic_key', {
  key: 'demo_basic_key',
  userId: 'demo_user_basic',
  plan: 'basic',
  isActive: true,
  createdAt: new Date(),
  usageCount: 0
});

API_KEYS.set('demo_pro_key', {
  key: 'demo_pro_key',
  userId: 'demo_user_pro',
  plan: 'pro',
  isActive: true,
  createdAt: new Date(),
  usageCount: 0
});

API_KEYS.set('demo_ultra_key', {
  key: 'demo_ultra_key',
  userId: 'demo_user_ultra',
  plan: 'ultra',
  isActive: true,
  createdAt: new Date(),
  usageCount: 0
});

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    userId: string;
    plan: SubscriptionPlan;
    apiKey: string;
    isAnonymous: boolean;
  };
}

export function generateApiKey(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `cfx_${timestamp}_${random}`;
}

export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authRequest = request as AuthenticatedRequest;

  // Get API key from multiple sources
  const apiKey = getApiKeyFromRequest(request);

  if (!apiKey) {
    // Anonymous user - assign free plan
    authRequest.user = {
      userId: `anon_${request.ip}`,
      plan: SUBSCRIPTION_PLANS.free as SubscriptionPlan,
      apiKey: 'anonymous',
      isAnonymous: true
    };

    logger.info({ ip: request.ip }, 'Anonymous request with free plan');
    return;
  }

  // Validate API key
  const apiKeyData = API_KEYS.get(apiKey);

  if (!apiKeyData || !apiKeyData.isActive) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid or inactive API key',
      timestamp: new Date().toISOString(),
      details: {
        code: 'INVALID_API_KEY',
        message: 'Please provide a valid API key or use the API without authentication for free tier access'
      }
    });
  }

  // Update usage tracking
  apiKeyData.lastUsed = new Date();
  apiKeyData.usageCount++;

  // Get user's subscription plan
  const plan = SUBSCRIPTION_PLANS[apiKeyData.plan] || SUBSCRIPTION_PLANS.free;
  if (!plan) {
    throw new Error('Invalid subscription plan configuration');
  }

  // Attach user info to request
  authRequest.user = {
    userId: apiKeyData.userId,
    plan,
    apiKey,
    isAnonymous: false
  };

  logger.info({
    userId: apiKeyData.userId,
    plan: plan.tier,
    endpoint: request.url
  }, 'Authenticated API request');
}

function getApiKeyFromRequest(request: FastifyRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers['x-api-key'] as string;
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check RapidAPI header (for RapidAPI integration)
  const rapidApiKey = request.headers['x-rapidapi-key'] as string;
  if (rapidApiKey) {
    return rapidApiKey;
  }

  // Check query parameter (less secure, for testing only)
  const query = request.query as Record<string, string>;
  if (query.api_key) {
    return query.api_key;
  }

  return null;
}

export function hasFeature(user: AuthenticatedRequest['user'], feature: string): boolean {
  if (!user) return false;
  return user.plan.features.includes(feature) || user.plan.features.includes('all');
}

export function checkFeatureAccess(feature: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authRequest = request as AuthenticatedRequest;

    if (!authRequest.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      });
    }

    if (!hasFeature(authRequest.user, feature)) {
      const plan = authRequest.user.plan;
      return reply.status(403).send({
        success: false,
        error: 'Feature not available in your plan',
        timestamp: new Date().toISOString(),
        details: {
          required_feature: feature,
          current_plan: plan.tier,
          upgrade_info: getUpgradeInfo(plan.tier)
        }
      });
    }
  };
}

function getUpgradeInfo(currentTier: string): string {
  switch (currentTier) {
    case 'free':
      return 'Upgrade to Basic plan ($5/mo) for portfolio endpoints and extended historical data';
    case 'basic':
      return 'Upgrade to Pro plan ($20/mo) for technical indicators and advanced features';
    case 'pro':
      return 'Upgrade to Ultra plan ($50/mo) for webhooks, alerts, and priority support';
    default:
      return 'Contact support for custom enterprise plans';
  }
}

// API key management functions
export function createApiKey(userId: string, plan: string): string {
  const apiKey = generateApiKey();

  API_KEYS.set(apiKey, {
    key: apiKey,
    userId,
    plan,
    isActive: true,
    createdAt: new Date(),
    usageCount: 0
  });

  logger.info({ userId, plan, apiKey: apiKey.substring(0, 10) + '...' }, 'Created new API key');

  return apiKey;
}

export function deactivateApiKey(apiKey: string): boolean {
  const keyData = API_KEYS.get(apiKey);
  if (keyData) {
    keyData.isActive = false;
    logger.info({ apiKey: apiKey.substring(0, 10) + '...' }, 'Deactivated API key');
    return true;
  }
  return false;
}

export function getApiKeyInfo(apiKey: string): ApiKeyData | null {
  return API_KEYS.get(apiKey) || null;
}

export function listUserKeys(userId: string): ApiKeyData[] {
  return Array.from(API_KEYS.values()).filter(key => key.userId === userId);
}