import { httpClient } from '../utils/http-client.js';
import { cacheService } from './cache.js';
import { appConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import type {
  CryptoPriceData,
  HistoricalPriceData,
  CoinMetadata,
  SupportedCryptoCurrencies,
} from '../types/index.js';

export class CoinGeckoService {
  private baseUrl = appConfig.COINGECKO_BASE_URL;
  private cacheTTL = 300; // 5 minutes

  async getSimplePrices(
    coinIds: string[],
    vsCurrencies: string[] = ['usd']
  ): Promise<CryptoPriceData[]> {
    const cacheKey = `coingecko:simple:${coinIds.join(',')}-${vsCurrencies.join(',')}`;

    const cached = await cacheService.get<CryptoPriceData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/simple/price?ids=${coinIds.join(',')}&vs_currencies=${vsCurrencies.join(',')}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`;

      const response = await httpClient.get<Record<string, Record<string, number | string>>>(url);

      const priceData: CryptoPriceData[] = [];

      for (const [coinId, data] of Object.entries(response)) {
        for (const currency of vsCurrencies) {
          if (data[currency]) {
            priceData.push({
              id: coinId,
              symbol: coinId, // Will be updated if we have metadata
              name: coinId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
              current_price: Number(data[currency]),
              market_cap: data[`${currency}_market_cap`]
                ? Number(data[`${currency}_market_cap`])
                : null,
              total_volume: data[`${currency}_24h_vol`]
                ? Number(data[`${currency}_24h_vol`])
                : null,
              price_change_24h: data[`${currency}_24h_change`]
                ? Number(data[`${currency}_24h_change`])
                : null,
              price_change_percentage_24h: data[`${currency}_24h_change`]
                ? Number(data[`${currency}_24h_change`])
                : null,
              last_updated: data.last_updated_at
                ? new Date(Number(data.last_updated_at) * 1000).toISOString()
                : new Date().toISOString(),
              vs_currency: currency,
            });
          }
        }
      }

      await cacheService.set(cacheKey, priceData, this.cacheTTL);
      logger.info(
        { coinIds, vsCurrencies, count: priceData.length },
        'Fetched crypto prices from CoinGecko'
      );

      return priceData;
    } catch (error) {
      logger.error(
        { error, coinIds, vsCurrencies },
        'Failed to fetch crypto prices from CoinGecko'
      );

      // Try to return stale cache data if available
      const staleCache = await cacheService.get<CryptoPriceData[]>(`${cacheKey}:stale`);
      if (staleCache) {
        logger.warn('Returning stale cache data due to API error');
        return staleCache;
      }

      throw new Error(`Failed to fetch crypto prices: ${(error as Error).message}`);
    }
  }

  async getMarketChart(
    coinId: string,
    vsCurrency: string = 'usd',
    days: number = 7
  ): Promise<HistoricalPriceData> {
    const cacheKey = `coingecko:chart:${coinId}-${vsCurrency}-${days}`;

    const cached = await cacheService.get<HistoricalPriceData>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=${vsCurrency}&days=${days}`;
      const response = await httpClient.get<HistoricalPriceData>(url);

      await cacheService.set(cacheKey, response, this.cacheTTL * 2); // Cache longer for historical data
      logger.info({ coinId, vsCurrency, days }, 'Fetched market chart from CoinGecko');

      return response;
    } catch (error) {
      logger.error(
        { error, coinId, vsCurrency, days },
        'Failed to fetch market chart from CoinGecko'
      );
      throw new Error(`Failed to fetch market chart: ${(error as Error).message}`);
    }
  }

  async getCoinsList(): Promise<CoinMetadata[]> {
    const cacheKey = 'coingecko:coins:list';

    const cached = await cacheService.get<CoinMetadata[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/coins/list`;
      const response = await httpClient.get<CoinMetadata[]>(url);

      await cacheService.set(cacheKey, response, 3600); // Cache for 1 hour
      logger.info({ count: response.length }, 'Fetched coins list from CoinGecko');

      return response;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch coins list from CoinGecko');
      throw new Error(`Failed to fetch coins list: ${(error as Error).message}`);
    }
  }

  async getCoinInfo(coinId: string): Promise<any> {
    const cacheKey = `coingecko:coin:${coinId}`;

    const cached = await cacheService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`;
      const response = await httpClient.get<any>(url);

      await cacheService.set(cacheKey, response, 1800); // Cache for 30 minutes
      logger.info({ coinId }, 'Fetched coin info from CoinGecko');

      return response;
    } catch (error) {
      logger.error({ error, coinId }, 'Failed to fetch coin info from CoinGecko');
      throw new Error(`Failed to fetch coin info: ${(error as Error).message}`);
    }
  }

  async getPopularCrypto(): Promise<CryptoPriceData[]> {
    const popularCoins: SupportedCryptoCurrencies[] = [
      'bitcoin',
      'ethereum',
      'binancecoin',
      'ripple',
      'cardano',
      'solana',
      'dogecoin',
      'polkadot',
      'avalanche-2',
      'chainlink',
    ];

    return this.getSimplePrices(popularCoins, ['usd', 'eur']);
  }

  // Method to validate if a coin exists
  async validateCoinId(coinId: string): Promise<boolean> {
    try {
      const coinsList = await this.getCoinsList();
      return coinsList.some((coin) => coin.id === coinId);
    } catch {
      return false;
    }
  }
}

export const coinGeckoService = new CoinGeckoService();
