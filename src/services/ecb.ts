import { parseString } from 'xml2js';
import { promisify } from 'util';
import { httpClient } from '../utils/http-client.js';
import { cacheService } from './cache.js';
import { appConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import type { ForexRateData, SupportedFiatCurrencies } from '../types/index.js';

const parseXML = promisify(parseString);

interface ECBRateData {
  currency: string;
  rate: string;
}

interface ECBDailyData {
  date: string;
  rates: ECBRateData[];
}

export class ECBService {
  private baseUrl = appConfig.ECB_BASE_URL;
  private cacheTTL = 3600; // 1 hour - ECB updates once daily

  async getDailyRates(): Promise<ForexRateData[]> {
    const cacheKey = 'ecb:daily:rates';

    const cached = await cacheService.get<ForexRateData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/eurofxref-daily.xml`;
      const xmlData = await httpClient.getText(url);
      const dailyData = await this.parseECBXML(xmlData);

      if (!dailyData) {
        throw new Error('No rate data found in ECB response');
      }

      const forexRates: ForexRateData[] = [
        // EUR as base currency with rate 1.0
        {
          currency: 'EUR',
          rate: 1.0,
          date: dailyData.date,
          base_currency: 'EUR',
        },
        // All other currencies from ECB
        ...dailyData.rates.map((rate) => ({
          currency: rate.currency,
          rate: parseFloat(rate.rate),
          date: dailyData.date,
          base_currency: 'EUR',
        })),
      ];

      await cacheService.set(cacheKey, forexRates, this.cacheTTL);

      // Also cache as stale backup
      await cacheService.set(`${cacheKey}:stale`, forexRates, this.cacheTTL * 24);

      logger.info(
        { date: dailyData.date, count: forexRates.length },
        'Fetched daily rates from ECB'
      );

      return forexRates;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch daily rates from ECB');

      // Try to return stale cache data if available
      const staleCache = await cacheService.get<ForexRateData[]>(`${cacheKey}:stale`);
      if (staleCache) {
        logger.warn('Returning stale ECB rate data due to API error');
        return staleCache;
      }

      throw new Error(`Failed to fetch ECB rates: ${(error as Error).message}`);
    }
  }

  async getHistoricalRates(days: number = 90): Promise<Record<string, ForexRateData[]>> {
    const cacheKey = `ecb:historical:${days}`;

    const cached = await cacheService.get<Record<string, ForexRateData[]>>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/eurofxref-hist-90d.xml`;
      const xmlData = await httpClient.getText(url);
      const historicalData = await this.parseECBHistoricalXML(xmlData);

      await cacheService.set(cacheKey, historicalData, this.cacheTTL * 2);
      logger.info(
        { days, dateCount: Object.keys(historicalData).length },
        'Fetched historical rates from ECB'
      );

      return historicalData;
    } catch (error) {
      logger.error({ error, days }, 'Failed to fetch historical rates from ECB');
      throw new Error(`Failed to fetch ECB historical rates: ${(error as Error).message}`);
    }
  }

  async getCrossRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
    try {
      const rates = await this.getDailyRates();
      const fromRate = rates.find((r) => r.currency === fromCurrency);
      const toRate = rates.find((r) => r.currency === toCurrency);

      if (fromCurrency === 'EUR') {
        return toRate ? toRate.rate : null;
      }

      if (toCurrency === 'EUR') {
        return fromRate ? 1 / fromRate.rate : null;
      }

      if (fromRate && toRate) {
        // Cross rate calculation: (1/fromRate) * toRate
        return toRate.rate / fromRate.rate;
      }

      return null;
    } catch (error) {
      logger.error({ error, fromCurrency, toCurrency }, 'Failed to calculate cross rate');
      return null;
    }
  }

  async getSupportedCurrencies(): Promise<string[]> {
    try {
      const rates = await this.getDailyRates();
      return rates.map((rate) => rate.currency).sort();
    } catch (error) {
      logger.error({ error }, 'Failed to get supported currencies');
      // Return common currencies as fallback
      return ['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SEK', 'NZD'];
    }
  }

  private async parseECBXML(xmlData: string): Promise<ECBDailyData | null> {
    try {
      const result: any = await parseXML(xmlData);

      const envelope = result['gesmes:Envelope'];
      if (!envelope || !envelope.Cube || !envelope.Cube.Cube) {
        return null;
      }

      const dailyCube = envelope.Cube.Cube;
      const date = dailyCube.$.time;

      if (!dailyCube.Cube || !Array.isArray(dailyCube.Cube)) {
        return null;
      }

      const rates: ECBRateData[] = dailyCube.Cube.map((cube: any) => ({
        currency: cube.$.currency,
        rate: cube.$.rate,
      }));

      return { date, rates };
    } catch (error) {
      logger.error({ error }, 'Failed to parse ECB XML');
      return null;
    }
  }

  private async parseECBHistoricalXML(xmlData: string): Promise<Record<string, ForexRateData[]>> {
    try {
      const result: any = await parseXML(xmlData);

      const envelope = result['gesmes:Envelope'];
      if (!envelope || !envelope.Cube || !envelope.Cube.Cube) {
        return {};
      }

      const historicalData: Record<string, ForexRateData[]> = {};
      const dailyCubes = Array.isArray(envelope.Cube.Cube)
        ? envelope.Cube.Cube
        : [envelope.Cube.Cube];

      for (const dailyCube of dailyCubes) {
        const date = dailyCube.$.time;

        if (!dailyCube.Cube) continue;

        const rateCubes = Array.isArray(dailyCube.Cube) ? dailyCube.Cube : [dailyCube.Cube];

        const rates: ForexRateData[] = [
          // EUR base rate
          {
            currency: 'EUR',
            rate: 1.0,
            date,
            base_currency: 'EUR',
          },
          // Other currencies
          ...rateCubes.map((cube: any) => ({
            currency: cube.$.currency,
            rate: parseFloat(cube.$.rate),
            date,
            base_currency: 'EUR',
          })),
        ];

        historicalData[date] = rates;
      }

      return historicalData;
    } catch (error) {
      logger.error({ error }, 'Failed to parse ECB historical XML');
      return {};
    }
  }

  // Method to validate supported currencies
  isSupportedCurrency(currency: string): boolean {
    const supportedCurrencies: SupportedFiatCurrencies[] = [
      'usd',
      'eur',
      'gbp',
      'jpy',
      'cad',
      'aud',
      'chf',
      'cny',
      'sek',
      'nzd',
    ];
    return supportedCurrencies.includes(currency.toLowerCase() as SupportedFiatCurrencies);
  }
}

export const ecbService = new ECBService();
