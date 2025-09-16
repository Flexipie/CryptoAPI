export interface CryptoPriceData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number | null;
  total_volume: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  last_updated: string;
  vs_currency: string;
}

export interface ForexRateData {
  currency: string;
  rate: number;
  date: string;
  base_currency: string;
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
  enableRedis: boolean;
  redisUrl?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  cache_hit?: boolean;
  error?: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export interface HistoricalPriceData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface CoinMetadata {
  id: string;
  symbol: string;
  name: string;
  platforms?: Record<string, string>;
}

export interface RateLimitConfig {
  max: number;
  timeWindow: number;
}

export interface RetryConfig {
  attempts: number;
  delay: number;
  backoffFactor: number;
}

export type SupportedFiatCurrencies =
  | 'usd'
  | 'eur'
  | 'gbp'
  | 'jpy'
  | 'cad'
  | 'aud'
  | 'chf'
  | 'cny'
  | 'sek'
  | 'nzd';

export type SupportedCryptoCurrencies =
  | 'bitcoin'
  | 'ethereum'
  | 'binancecoin'
  | 'ripple'
  | 'cardano'
  | 'solana'
  | 'dogecoin'
  | 'polkadot'
  | 'avalanche-2'
  | 'chainlink';
