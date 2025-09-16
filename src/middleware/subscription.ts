import { FastifyRequest, FastifyReply } from 'fastify';

export interface SubscriptionTier {
  tier: 'free' | 'starter' | 'professional' | 'enterprise' | 'ultra';
  requestsPerMonth: number;
  requestsPerHour: number;
  burstLimit: number;
  priority: number;
  features: string[];
  slaUptime: string;
  supportLevel: string;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    tier: 'free',
    requestsPerMonth: 100,
    requestsPerHour: 10,
    burstLimit: 5,
    priority: 1,
    features: ['basic_data'],
    slaUptime: 'Best effort',
    supportLevel: 'Community'
  },
  starter: {
    tier: 'starter',
    requestsPerMonth: 10000,
    requestsPerHour: 500,
    burstLimit: 100,
    priority: 2,
    features: ['basic_data', 'historical_data', 'priority_processing'],
    slaUptime: '99.5%',
    supportLevel: 'Email (24h)'
  },
  professional: {
    tier: 'professional',
    requestsPerMonth: 100000,
    requestsPerHour: 2000,
    burstLimit: 400,
    priority: 3,
    features: [
      'basic_data',
      'historical_data',
      'priority_processing',
      'advanced_analytics',
      'webhook_notifications',
      'extended_history'
    ],
    slaUptime: '99.8%',
    supportLevel: 'Email (6h)'
  },
  enterprise: {
    tier: 'enterprise',
    requestsPerMonth: 1000000,
    requestsPerHour: 10000,
    burstLimit: 2000,
    priority: 4,
    features: [
      'basic_data',
      'historical_data',
      'priority_processing',
      'advanced_analytics',
      'webhook_notifications',
      'extended_history',
      'custom_rate_limits',
      'dedicated_support',
      'white_label_docs',
      'yearly_history'
    ],
    slaUptime: '99.9%',
    supportLevel: 'Direct (2h)'
  },
  ultra: {
    tier: 'ultra',
    requestsPerMonth: 5000000,
    requestsPerHour: 50000,
    burstLimit: 10000,
    priority: 5,
    features: [
      'basic_data',
      'historical_data',
      'priority_processing',
      'advanced_analytics',
      'webhook_notifications',
      'extended_history',
      'custom_rate_limits',
      'dedicated_support',
      'white_label_docs',
      'yearly_history',
      'unlimited_rate_limits',
      'phone_support',
      'dedicated_infrastructure',
      'custom_sla',
      'priority_features',
      'on_premise_option'
    ],
    slaUptime: '99.95%',
    supportLevel: 'Phone + Email (30min)'
  }
};

export function getSubscriptionTier(request: FastifyRequest): SubscriptionTier {
  // RapidAPI passes subscription info via headers
  const subscription = request.headers['x-rapidapi-subscription'] as string || 'free';
  const rapidApiUser = request.headers['x-rapidapi-user'] as string;
  const rapidApiProxy = request.headers['x-rapidapi-proxy-secret'] as string;

  // Log usage for analytics (only in production)
  if (process.env.NODE_ENV === 'production' && rapidApiUser) {
    request.log.info({
      endpoint: request.url,
      method: request.method,
      user: rapidApiUser,
      subscription: subscription,
      hasProxy: !!rapidApiProxy
    }, 'RapidAPI usage tracking');
  }

  // Return the subscription tier, defaulting to free
  return SUBSCRIPTION_TIERS[subscription.toLowerCase()] || SUBSCRIPTION_TIERS.free;
}

export function hasFeature(tier: SubscriptionTier, feature: string): boolean {
  return tier.features.includes(feature);
}

export function addSubscriptionInfo(request: FastifyRequest, reply: FastifyReply, next: () => void) {
  // Add subscription tier to request context
  (request as any).subscriptionTier = getSubscriptionTier(request);
  next();
}

// Priority queue helper for paid users
export function getPriorityDelay(tier: SubscriptionTier): number {
  // Higher tier = lower delay
  const delays = {
    1: 100, // Free - 100ms delay
    2: 50,  // Starter - 50ms delay
    3: 20,  // Professional - 20ms delay
    4: 10,  // Enterprise - 10ms delay
    5: 0    // Ultra - no delay
  };

  return delays[tier.priority] || 100;
}

// Rate limiting helper based on subscription
export function getCustomRateLimit(tier: SubscriptionTier) {
  return {
    max: tier.requestsPerHour,
    timeWindow: '1 hour',
    skipOnError: tier.priority >= 4, // Skip rate limiting on errors for enterprise+
    keyGenerator: (request: FastifyRequest) => {
      // Use RapidAPI user ID if available, otherwise fall back to IP
      const rapidApiUser = request.headers['x-rapidapi-user'] as string;
      return rapidApiUser || request.ip;
    },
    errorResponseBuilder: (request: FastifyRequest, context: any) => {
      const tier = (request as any).subscriptionTier as SubscriptionTier;
      return {
        success: false,
        error: {
          type: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded for ${tier.tier} plan. Limit: ${tier.requestsPerHour} requests/hour`,
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            limit: tier.requestsPerHour,
            window: '1 hour',
            tier: tier.tier,
            upgradeInfo: tier.tier === 'free'
              ? 'Upgrade to Starter plan for 500 requests/hour'
              : 'Contact support for higher limits'
          }
        },
        timestamp: new Date().toISOString()
      };
    }
  };
}