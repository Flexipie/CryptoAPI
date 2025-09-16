import { LRUCache } from 'lru-cache';
import { createClient, RedisClientType } from 'redis';
import { appConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export class CacheService {
  private memoryCache: LRUCache<string, string>;
  private redisClient: RedisClientType | null = null;
  private isRedisConnected = false;

  constructor() {
    this.memoryCache = new LRUCache({
      max: appConfig.MEMORY_CACHE_SIZE,
      ttl: appConfig.CACHE_TTL_SECONDS * 1000,
    });

    if (appConfig.ENABLE_REDIS) {
      this.initRedis();
    }
  }

  private async initRedis(): Promise<void> {
    try {
      this.redisClient = createClient({
        url: appConfig.REDIS_URL,
        socket: {
          connectTimeout: 10000,
        },
      });

      this.redisClient.on('error', (err) => {
        logger.warn({ err }, 'Redis connection error, falling back to memory cache');
        this.isRedisConnected = false;
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isRedisConnected = true;
      });

      this.redisClient.on('disconnect', () => {
        logger.warn('Redis disconnected, using memory cache');
        this.isRedisConnected = false;
      });

      await this.redisClient.connect();
    } catch (error) {
      logger.warn({ error }, 'Failed to initialize Redis, using memory cache only');
      this.redisClient = null;
      this.isRedisConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value) {
          logger.debug({ key }, 'Cache hit from Redis');
          return JSON.parse(value) as T;
        }
      }

      const memoryValue = this.memoryCache.get(key);
      if (memoryValue) {
        logger.debug({ key }, 'Cache hit from memory');
        return JSON.parse(memoryValue) as T;
      }

      logger.debug({ key }, 'Cache miss');
      return null;
    } catch (error) {
      logger.error({ error, key }, 'Error retrieving from cache');
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || appConfig.CACHE_TTL_SECONDS;
    const serializedValue = JSON.stringify(value);

    try {
      this.memoryCache.set(key, serializedValue, { ttl: ttl * 1000 });

      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.setEx(key, ttl, serializedValue);
        logger.debug({ key, ttl }, 'Cached in both Redis and memory');
      } else {
        logger.debug({ key, ttl }, 'Cached in memory only');
      }
    } catch (error) {
      logger.error({ error, key }, 'Error setting cache');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);

      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.del(key);
      }

      logger.debug({ key }, 'Deleted from cache');
    } catch (error) {
      logger.error({ error, key }, 'Error deleting from cache');
    }
  }

  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();

      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.flushDb();
      }

      logger.info('Cache cleared');
    } catch (error) {
      logger.error({ error }, 'Error clearing cache');
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.redisClient) {
        await this.redisClient.disconnect();
      }
      logger.info('Cache service disconnected');
    } catch (error) {
      logger.error({ error }, 'Error disconnecting from cache');
    }
  }

  getStats() {
    return {
      memoryCache: {
        size: this.memoryCache.size,
        maxSize: this.memoryCache.max,
      },
      redis: {
        connected: this.isRedisConnected,
        enabled: appConfig.ENABLE_REDIS,
      },
    };
  }
}

export const cacheService = new CacheService();
