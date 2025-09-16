import { request } from 'undici';
import { appConfig } from './config.js';
import { logger } from './logger.js';
import type { RetryConfig } from '../types/index.js';

export class HttpClient {
  private retryConfig: RetryConfig;

  constructor() {
    this.retryConfig = {
      attempts: appConfig.RETRY_ATTEMPTS,
      delay: appConfig.RETRY_DELAY,
      backoffFactor: 2,
    };
  }

  async get<T>(url: string, options: { headers?: Record<string, string> } = {}): Promise<T> {
    return this.executeWithRetry(async () => {
      const response = await request(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'crypto-fx-api/1.0.0',
          Accept: 'application/json',
          ...options.headers,
        },
        headersTimeout: appConfig.REQUEST_TIMEOUT,
        bodyTimeout: appConfig.REQUEST_TIMEOUT,
      });

      if (response.statusCode >= 400) {
        throw new Error(`HTTP ${response.statusCode}: ${await response.body.text()}`);
      }

      const text = await response.body.text();
      try {
        return JSON.parse(text) as T;
      } catch (parseError) {
        logger.error({ parseError, text: text.slice(0, 500) }, 'Failed to parse JSON response');
        throw new Error('Invalid JSON response from server');
      }
    }, url);
  }

  async getText(url: string, options: { headers?: Record<string, string> } = {}): Promise<string> {
    return this.executeWithRetry(async () => {
      const response = await request(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'crypto-fx-api/1.0.0',
          Accept: 'text/xml,application/xml,text/plain',
          ...options.headers,
        },
        headersTimeout: appConfig.REQUEST_TIMEOUT,
        bodyTimeout: appConfig.REQUEST_TIMEOUT,
      });

      if (response.statusCode >= 400) {
        throw new Error(`HTTP ${response.statusCode}: ${await response.body.text()}`);
      }

      return response.body.text();
    }, url);
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, url: string): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.retryConfig.attempts; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          logger.info({ url, attempt }, 'Request succeeded after retry');
        }
        return result;
      } catch (error) {
        lastError = error as Error;
        logger.warn(
          { error: lastError.message, url, attempt, maxAttempts: this.retryConfig.attempts },
          'Request failed'
        );

        if (attempt === this.retryConfig.attempts) {
          break;
        }

        if (this.shouldRetry(error as Error)) {
          const delay =
            this.retryConfig.delay * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }

    logger.error({ error: lastError!.message, url }, 'Request failed after all retries');
    throw lastError!;
  }

  private shouldRetry(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('http 429') ||
      message.includes('http 502') ||
      message.includes('http 503') ||
      message.includes('http 504')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const httpClient = new HttpClient();
