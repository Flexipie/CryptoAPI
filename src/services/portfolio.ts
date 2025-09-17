import { coinGeckoService } from './coingecko.js';
import { logger } from '../utils/logger.js';

export interface PortfolioHolding {
  id: string;          // Coin ID (e.g., 'bitcoin')
  amount: number;      // Amount held
  cost_basis?: number; // Optional: what you paid per coin
  purchase_date?: string; // Optional: when purchased
}

export interface PortfolioRequest {
  holdings: PortfolioHolding[];
  base_currency: string; // Currency for calculations (usd, eur, etc.)
}

export interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  current_price: number;
  current_value: number;
  cost_basis?: number | undefined;
  total_cost?: number | undefined;
  profit_loss?: number | undefined;
  profit_loss_percentage?: number | undefined;
  weight_percentage: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
}

export interface PortfolioSummary {
  total_value: number;
  total_cost?: number | undefined;
  total_profit_loss?: number | undefined;
  total_profit_loss_percentage?: number | undefined;
  asset_count: number;
  base_currency: string;
  last_updated: string;
}

export interface PortfolioResponse {
  summary: PortfolioSummary;
  assets: PortfolioAsset[];
  performance: {
    best_performer: PortfolioAsset | null;
    worst_performer: PortfolioAsset | null;
    most_valuable: PortfolioAsset | null;
  };
}

export interface PortfolioAllocation {
  allocation: {
    id: string;
    name: string;
    symbol: string;
    percentage: number;
    value: number;
  }[];
  diversification_score: number; // 0-100, higher is more diversified
  risk_level: 'low' | 'medium' | 'high';
}

class PortfolioService {
  async calculatePortfolio(request: PortfolioRequest): Promise<PortfolioResponse> {
    try {
      const { holdings, base_currency } = request;

      if (!holdings || holdings.length === 0) {
        throw new Error('Portfolio holdings cannot be empty');
      }

      if (holdings.length > 500) {
        throw new Error('Maximum 500 holdings allowed per portfolio');
      }

      // Validate coin IDs
      const coinIds = holdings.map(h => h.id);
      const uniqueCoinIds = [...new Set(coinIds)];

      logger.info({
        holdingCount: holdings.length,
        uniqueCoins: uniqueCoinIds.length,
        baseCurrency: base_currency
      }, 'Calculating portfolio');

      // Get current prices for all coins
      const priceData = await coinGeckoService.getSimplePrices(uniqueCoinIds, [base_currency]);

      // Create price lookup map
      const priceMap = new Map();
      priceData.forEach(price => {
        priceMap.set(price.id, {
          current_price: price.current_price,
          symbol: price.symbol,
          name: price.name,
          price_change_24h: price.price_change_24h || 0,
          price_change_percentage_24h: price.price_change_percentage_24h || 0
        });
      });

      // Calculate portfolio assets
      const assets: PortfolioAsset[] = [];
      let totalValue = 0;
      let totalCost = 0;
      let hasCostBasis = false;

      for (const holding of holdings) {
        const priceInfo = priceMap.get(holding.id);

        if (!priceInfo) {
          logger.warn({ coinId: holding.id }, 'Coin price not found, skipping');
          continue;
        }

        const currentValue = holding.amount * priceInfo.current_price;
        const totalHoldingCost = holding.cost_basis ? holding.amount * holding.cost_basis : undefined;

        if (totalHoldingCost !== undefined) {
          hasCostBasis = true;
          totalCost += totalHoldingCost;
        }

        const asset: PortfolioAsset = {
          id: holding.id,
          symbol: priceInfo.symbol,
          name: priceInfo.name,
          amount: holding.amount,
          current_price: priceInfo.current_price,
          current_value: currentValue,
          cost_basis: holding.cost_basis,
          total_cost: totalHoldingCost,
          profit_loss: totalHoldingCost ? currentValue - totalHoldingCost : undefined,
          profit_loss_percentage: totalHoldingCost ? ((currentValue - totalHoldingCost) / totalHoldingCost) * 100 : undefined,
          weight_percentage: 0, // Will calculate after we have total
          price_change_24h: priceInfo.price_change_24h,
          price_change_percentage_24h: priceInfo.price_change_percentage_24h
        };

        assets.push(asset);
        totalValue += currentValue;
      }

      // Calculate weight percentages
      assets.forEach(asset => {
        asset.weight_percentage = totalValue > 0 ? (asset.current_value / totalValue) * 100 : 0;
      });

      // Sort by value (highest first)
      assets.sort((a, b) => b.current_value - a.current_value);

      // Calculate performance metrics
      const performance = {
        best_performer: assets.length > 0 ?
          assets.reduce((best, current) =>
            (current.profit_loss_percentage || -Infinity) > (best.profit_loss_percentage || -Infinity) ? current : best
          ) : null,
        worst_performer: assets.length > 0 ?
          assets.reduce((worst, current) =>
            (current.profit_loss_percentage || Infinity) < (worst.profit_loss_percentage || Infinity) ? current : worst
          ) : null,
        most_valuable: assets.length > 0 ? assets[0] || null : null
      };

      // Create summary
      const summary: PortfolioSummary = {
        total_value: totalValue,
        total_cost: hasCostBasis ? totalCost : undefined,
        total_profit_loss: hasCostBasis ? totalValue - totalCost : undefined,
        total_profit_loss_percentage: hasCostBasis && totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : undefined,
        asset_count: assets.length,
        base_currency,
        last_updated: new Date().toISOString()
      };

      logger.info({
        totalValue,
        assetCount: assets.length,
        baseCurrency: base_currency
      }, 'Portfolio calculated successfully');

      return {
        summary,
        assets,
        performance
      };

    } catch (error) {
      logger.error({ error }, 'Failed to calculate portfolio');
      throw new Error(`Portfolio calculation failed: ${(error as Error).message}`);
    }
  }

  async getPortfolioAllocation(request: PortfolioRequest): Promise<PortfolioAllocation> {
    try {
      const portfolio = await this.calculatePortfolio(request);

      const allocation = portfolio.assets.map(asset => ({
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        percentage: asset.weight_percentage,
        value: asset.current_value
      }));

      // Calculate diversification score (higher = more diversified)
      const diversificationScore = this.calculateDiversificationScore(allocation);

      // Determine risk level based on concentration
      const topHolding = allocation[0];
      const topPercentage = topHolding?.percentage || 0;
      const risk_level = topPercentage > 70 ? 'high' :
                        topPercentage > 40 ? 'medium' : 'low';

      return {
        allocation,
        diversification_score: diversificationScore,
        risk_level
      };

    } catch (error) {
      logger.error({ error }, 'Failed to calculate portfolio allocation');
      throw new Error(`Portfolio allocation failed: ${(error as Error).message}`);
    }
  }

  private calculateDiversificationScore(allocation: { percentage: number }[]): number {
    if (allocation.length === 0) return 0;
    if (allocation.length === 1) return 10;

    // Calculate Herfindahl-Hirschman Index (HHI) and convert to diversity score
    const hhi = allocation.reduce((sum, asset) => sum + Math.pow(asset.percentage, 2), 0);

    // Convert HHI to 0-100 scale (lower HHI = higher diversification)
    // Perfect diversification (equal weights) would have HHI = 10000/n
    const maxHHI = 10000; // 100% in one asset
    const minHHI = 10000 / allocation.length; // Equal distribution

    const normalizedHHI = Math.max(0, Math.min(1, (maxHHI - hhi) / (maxHHI - minHHI)));

    return Math.round(normalizedHHI * 100);
  }

  async getHistoricalPerformance(_request: PortfolioRequest, _days: number = 30): Promise<any> {
    // This would be a premium feature - calculate portfolio value over time
    // For now, return a placeholder that can be implemented later
    return {
      message: 'Historical performance tracking coming soon',
      required_plan: 'pro',
      contact: 'Upgrade to Pro plan for historical portfolio tracking'
    };
  }

  // Utility function to validate portfolio request
  validatePortfolioRequest(request: any): PortfolioRequest {
    if (!request.holdings || !Array.isArray(request.holdings)) {
      throw new Error('Holdings must be an array');
    }

    if (request.holdings.length === 0) {
      throw new Error('Holdings array cannot be empty');
    }

    if (request.holdings.length > 500) {
      throw new Error('Maximum 500 holdings allowed');
    }

    const baseCurrency = request.base_currency || 'usd';

    const validatedHoldings: PortfolioHolding[] = request.holdings.map((holding: any, index: number) => {
      if (!holding.id || typeof holding.id !== 'string') {
        throw new Error(`Invalid coin ID at index ${index}`);
      }

      if (!holding.amount || typeof holding.amount !== 'number' || holding.amount <= 0) {
        throw new Error(`Invalid amount at index ${index} - must be a positive number`);
      }

      const validatedHolding: PortfolioHolding = {
        id: holding.id.toLowerCase(),
        amount: holding.amount
      };

      if (holding.cost_basis && typeof holding.cost_basis === 'number' && holding.cost_basis > 0) {
        validatedHolding.cost_basis = holding.cost_basis;
      }

      if (holding.purchase_date && typeof holding.purchase_date === 'string') {
        validatedHolding.purchase_date = holding.purchase_date;
      }

      return validatedHolding;
    });

    return {
      holdings: validatedHoldings,
      base_currency: baseCurrency
    };
  }
}

export const portfolioService = new PortfolioService();