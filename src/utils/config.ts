import { config } from 'dotenv';
import { z } from 'zod';

config();

const configSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  ENABLE_REDIS: z
    .string()
    .default('true')
    .transform((val) => val.toLowerCase() === 'true'),
  CACHE_TTL_SECONDS: z.string().default('300').transform(Number),
  MEMORY_CACHE_SIZE: z.string().default('1000').transform(Number),

  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_WINDOW: z.string().default('60000').transform(Number),

  COINGECKO_BASE_URL: z.string().default('https://api.coingecko.com/api/v3'),
  ECB_BASE_URL: z.string().default('https://www.ecb.europa.eu/stats/eurofxref'),

  REQUEST_TIMEOUT: z.string().default('10000').transform(Number),
  RETRY_ATTEMPTS: z.string().default('3').transform(Number),
  RETRY_DELAY: z.string().default('1000').transform(Number),
});

export type Config = z.infer<typeof configSchema>;

export const appConfig: Config = configSchema.parse(process.env);
