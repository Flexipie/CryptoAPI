# 🚀 Crypto + FX Market API Documentation v2.0

A production-ready REST API providing real-time cryptocurrency prices, **advanced portfolio management**, and foreign exchange rates. Features subscription-based authentication, sophisticated portfolio analytics, and enterprise-grade rate limiting.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Authentication & API Keys](#authentication--api-keys)
- [Subscription Plans](#subscription-plans)
- [Rate Limits](#rate-limits)
- [Response Format](#response-format)
- [Cryptocurrency Endpoints](#cryptocurrency-endpoints)
- [Portfolio Management Endpoints](#portfolio-management-endpoints)
- [Foreign Exchange Endpoints](#foreign-exchange-endpoints)
- [Health Check Endpoints](#health-check-endpoints)
- [Code Examples](#code-examples)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Free Tier (No Authentication)
```bash
# Get popular cryptocurrencies (Free)
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/popular"

# Get Bitcoin price (Free)
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/prices?ids=bitcoin&vs_currencies=usd"
```

### With API Key (Portfolio Features)
```bash
# Calculate portfolio value (Requires Basic+ plan)
curl -H "X-API-Key: your_api_key" \
     -H "Content-Type: application/json" \
     -X POST "https://cryptoapi-production-ad23.up.railway.app/api/v1/portfolio/calculate" \
     -d '{"holdings": [{"id": "bitcoin", "amount": 1.5}, {"id": "ethereum", "amount": 10}], "base_currency": "usd"}'

# Get portfolio allocation analysis (Basic+)
curl -H "X-API-Key: your_api_key" \
     -H "Content-Type: application/json" \
     -X POST "https://cryptoapi-production-ad23.up.railway.app/api/v1/portfolio/allocation" \
     -d '{"holdings": [{"id": "bitcoin", "amount": 0.5}, {"id": "ethereum", "amount": 2}]}'
```

## 🔐 Authentication & API Keys

### Authentication Methods

The API supports multiple authentication methods:

1. **X-API-Key Header** (Recommended)
```bash
curl -H "X-API-Key: your_api_key" "https://api-url/endpoint"
```

2. **Authorization Bearer Token**
```bash
curl -H "Authorization: Bearer your_api_key" "https://api-url/endpoint"
```

3. **Query Parameter** (For testing only)
```bash
curl "https://api-url/endpoint?api_key=your_api_key"
```

4. **No Authentication** (Free tier with limitations)
```bash
curl "https://api-url/endpoint"
```

### Demo API Keys for Testing

```bash
# Free Plan (100 requests/day)
X-API-Key: demo_free_key

# Basic Plan (10,000 requests/month)
X-API-Key: demo_basic_key

# Pro Plan (100,000 requests/month)
X-API-Key: demo_pro_key
```

## 💰 Subscription Plans

| Plan | Price | Requests/Day | Requests/Hour | Features |
|------|-------|-------------|---------------|----------|
| **Free** | $0/month | 100 | 25 | Basic crypto data |
| **Basic** | $5/month | 333 (~10k/month) | 50 | Portfolio basic, extended history |
| **Pro** | $20/month | 3,333 (~100k/month) | 200 | Advanced portfolio, technical indicators |
| **Ultra** | $50/month | 16,666 (~500k/month) | 1000 | All features, webhooks, alerts |

### Feature Matrix

| Feature | Free | Basic | Pro | Ultra |
|---------|------|-------|-----|-------|
| Crypto Prices | ✅ | ✅ | ✅ | ✅ |
| Historical Data (days) | 7 | 90 | 365 | 1095 |
| Portfolio Calculator | ❌ | ✅ | ✅ | ✅ |
| Portfolio Allocation | ❌ | ✅ | ✅ | ✅ |
| Risk Analysis | ❌ | ✅ | ✅ | ✅ |
| Performance Tracking | ❌ | ❌ | ✅ | ✅ |
| Technical Indicators | ❌ | ❌ | ✅ | ✅ |
| Webhooks & Alerts | ❌ | ❌ | ❌ | ✅ |
| Priority Support | ❌ | Email | Email | Phone |

## ⚡ Rate Limits

Rate limits are enforced per API key (or per IP for anonymous users):

### Rate Limit Headers
```http
X-RateLimit-Limit-Hourly: 200
X-RateLimit-Remaining-Hourly: 195
X-RateLimit-Reset-Hourly: 2025-01-01T01:00:00Z
X-RateLimit-Limit-Daily: 3333
X-RateLimit-Remaining-Daily: 3200
X-RateLimit-Reset-Daily: 2025-01-02T00:00:00Z
X-RateLimit-Plan: pro
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": "Daily rate limit exceeded",
  "timestamp": "2025-01-01T00:00:00Z",
  "details": {
    "type": "DAILY_RATE_LIMIT_EXCEEDED",
    "limit": 333,
    "current_usage": 333,
    "reset_in_seconds": 3600,
    "plan": "basic",
    "upgrade_info": "Upgrade to Pro plan ($20/mo) for 100,000 requests/month"
  }
}
```

---

# 💰 Portfolio Management Endpoints

The portfolio endpoints are the **premium killer feature** of this API, providing sophisticated portfolio analytics that would take developers weeks to implement.

## 1. Calculate Portfolio Value

Calculate total portfolio value with detailed asset breakdown, profit/loss analysis, and performance metrics.

### Endpoint
```
POST /api/v1/portfolio/calculate
```

### Authentication
**Required:** Basic plan or higher

### Request Body
```json
{
  "holdings": [
    {
      "id": "bitcoin",
      "amount": 1.5,
      "cost_basis": 45000,  // Optional: what you paid per coin
      "purchase_date": "2023-01-15"  // Optional
    },
    {
      "id": "ethereum",
      "amount": 10,
      "cost_basis": 2500
    },
    {
      "id": "cardano",
      "amount": 5000
    }
  ],
  "base_currency": "usd"  // usd, eur, btc, eth
}
```

### Example Request
```bash
curl -H "X-API-Key: demo_basic_key" \
     -H "Content-Type: application/json" \
     -X POST "https://cryptoapi-production-ad23.up.railway.app/api/v1/portfolio/calculate" \
     -d '{
       "holdings": [
         {"id": "bitcoin", "amount": 1.5, "cost_basis": 45000},
         {"id": "ethereum", "amount": 10, "cost_basis": 2500}
       ],
       "base_currency": "usd"
     }'
```

### Response
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_value": 174469.5,
      "total_cost": 92500,
      "total_profit_loss": 81969.5,
      "total_profit_loss_percentage": 88.62,
      "asset_count": 2,
      "base_currency": "usd",
      "last_updated": "2025-01-01T00:00:00Z"
    },
    "assets": [
      {
        "id": "bitcoin",
        "symbol": "btc",
        "name": "Bitcoin",
        "amount": 1.5,
        "current_price": 116313,
        "current_value": 174469.5,
        "cost_basis": 45000,
        "total_cost": 67500,
        "profit_loss": 106969.5,
        "profit_loss_percentage": 158.47,
        "weight_percentage": 95.13,
        "price_change_24h": 0.83,
        "price_change_percentage_24h": 0.83
      },
      {
        "id": "ethereum",
        "symbol": "eth",
        "name": "Ethereum",
        "amount": 10,
        "current_price": 4500,
        "current_value": 45000,
        "cost_basis": 2500,
        "total_cost": 25000,
        "profit_loss": 20000,
        "profit_loss_percentage": 80.0,
        "weight_percentage": 4.87,
        "price_change_24h": -0.78,
        "price_change_percentage_24h": -0.78
      }
    ],
    "performance": {
      "best_performer": {
        "id": "bitcoin",
        "profit_loss_percentage": 158.47
      },
      "worst_performer": {
        "id": "ethereum",
        "profit_loss_percentage": 80.0
      },
      "most_valuable": {
        "id": "bitcoin",
        "current_value": 174469.5
      }
    }
  },
  "timestamp": "2025-01-01T00:00:00Z",
  "cache_hit": false
}
```

## 2. Portfolio Allocation Analysis

Get portfolio allocation breakdown with diversification scoring and risk assessment.

### Endpoint
```
POST /api/v1/portfolio/allocation
```

### Authentication
**Required:** Basic plan or higher

### Example Request
```bash
curl -H "X-API-Key: demo_pro_key" \
     -H "Content-Type: application/json" \
     -X POST "https://cryptoapi-production-ad23.up.railway.app/api/v1/portfolio/allocation" \
     -d '{
       "holdings": [
         {"id": "bitcoin", "amount": 0.5},
         {"id": "ethereum", "amount": 2},
         {"id": "cardano", "amount": 1000}
       ],
       "base_currency": "usd"
     }'
```

### Response
```json
{
  "success": true,
  "data": {
    "allocation": [
      {
        "id": "bitcoin",
        "name": "Bitcoin",
        "symbol": "btc",
        "percentage": 85.51,
        "value": 58156.5
      },
      {
        "id": "ethereum",
        "name": "Ethereum",
        "symbol": "eth",
        "percentage": 13.21,
        "value": 9000
      },
      {
        "id": "cardano",
        "name": "Cardano",
        "symbol": "ada",
        "percentage": 1.28,
        "value": 872.63
      }
    ],
    "diversification_score": 38,  // 0-100, higher = more diversified
    "risk_level": "high"  // low/medium/high based on concentration
  },
  "timestamp": "2025-01-01T00:00:00Z",
  "cache_hit": false
}
```

### Risk Assessment Logic
- **High Risk:** Top holding > 70% of portfolio
- **Medium Risk:** Top holding 40-70% of portfolio
- **Low Risk:** Top holding < 40% of portfolio

## 3. Quick Portfolio Value

Lightweight endpoint for quick portfolio value checks.

### Endpoint
```
POST /api/v1/portfolio/value
```

### Authentication
**Required:** Basic plan or higher

### Example Request
```bash
curl -H "X-API-Key: demo_basic_key" \
     -H "Content-Type: application/json" \
     -X POST "https://cryptoapi-production-ad23.up.railway.app/api/v1/portfolio/value" \
     -d '{
       "holdings": [
         {"id": "bitcoin", "amount": 1},
         {"id": "ethereum", "amount": 5}
       ],
       "base_currency": "usd"
     }'
```

### Response
```json
{
  "success": true,
  "data": {
    "total_value": 138813,
    "asset_count": 2,
    "base_currency": "usd",
    "last_updated": "2025-01-01T00:00:00Z"
  },
  "timestamp": "2025-01-01T00:00:00Z",
  "cache_hit": false
}
```

## 4. Historical Performance (Pro Feature)

Track portfolio performance over time.

### Endpoint
```
POST /api/v1/portfolio/performance
```

### Authentication
**Required:** Pro plan or higher

### Request Body
```json
{
  "holdings": [
    {"id": "bitcoin", "amount": 1, "purchase_date": "2024-01-01"},
    {"id": "ethereum", "amount": 5, "purchase_date": "2024-01-01"}
  ],
  "base_currency": "usd",
  "days": 30
}
```

### Response
```json
{
  "success": true,
  "data": {
    "message": "Historical performance tracking coming soon",
    "required_plan": "pro",
    "contact": "Upgrade to Pro plan for historical portfolio tracking"
  },
  "timestamp": "2025-01-01T00:00:00Z"
}
```

---

# 💻 Code Examples

## JavaScript/Node.js Portfolio Management

```javascript
class CryptoPortfolioAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://cryptoapi-production-ad23.up.railway.app/api/v1';
  }

  async calculatePortfolio(holdings, baseCurrency = 'usd') {
    const response = await fetch(`${this.baseUrl}/portfolio/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({
        holdings,
        base_currency: baseCurrency
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    return data.data;
  }

  async getPortfolioAllocation(holdings, baseCurrency = 'usd') {
    const response = await fetch(`${this.baseUrl}/portfolio/allocation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify({
        holdings,
        base_currency: baseCurrency
      })
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    return data.data;
  }
}

// Usage Example
const api = new CryptoPortfolioAPI('your_api_key');

async function analyzePortfolio() {
  const holdings = [
    { id: 'bitcoin', amount: 1.5, cost_basis: 45000 },
    { id: 'ethereum', amount: 10, cost_basis: 2500 },
    { id: 'cardano', amount: 5000, cost_basis: 0.5 }
  ];

  try {
    // Get detailed portfolio analysis
    const portfolio = await api.calculatePortfolio(holdings);
    console.log('Portfolio Value:', portfolio.summary.total_value);
    console.log('Total P&L:', portfolio.summary.total_profit_loss);

    // Get allocation analysis
    const allocation = await api.getPortfolioAllocation(holdings);
    console.log('Risk Level:', allocation.risk_level);
    console.log('Diversification Score:', allocation.diversification_score);

    // Display allocation breakdown
    allocation.allocation.forEach(asset => {
      console.log(`${asset.name}: ${asset.percentage.toFixed(2)}% ($${asset.value.toFixed(2)})`);
    });

  } catch (error) {
    console.error('Portfolio analysis failed:', error.message);
  }
}

analyzePortfolio();
```

## Python Portfolio Tracker

```python
import requests
import json
from typing import List, Dict

class CryptoPortfolioAPI:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = 'https://cryptoapi-production-ad23.up.railway.app/api/v1'
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }

    def calculate_portfolio(self, holdings: List[Dict], base_currency: str = 'usd') -> Dict:
        response = requests.post(
            f'{self.base_url}/portfolio/calculate',
            headers=self.headers,
            json={
                'holdings': holdings,
                'base_currency': base_currency
            }
        )

        data = response.json()
        if not data['success']:
            raise Exception(data['error'])

        return data['data']

    def get_allocation(self, holdings: List[Dict], base_currency: str = 'usd') -> Dict:
        response = requests.post(
            f'{self.base_url}/portfolio/allocation',
            headers=self.headers,
            json={
                'holdings': holdings,
                'base_currency': base_currency
            }
        )

        data = response.json()
        if not data['success']:
            raise Exception(data['error'])

        return data['data']

# Usage Example
api = CryptoPortfolioAPI('your_api_key')

# Define your portfolio
portfolio_holdings = [
    {'id': 'bitcoin', 'amount': 2.0, 'cost_basis': 50000},
    {'id': 'ethereum', 'amount': 15, 'cost_basis': 3000},
    {'id': 'cardano', 'amount': 10000, 'cost_basis': 0.45}
]

try:
    # Calculate portfolio
    portfolio = api.calculate_portfolio(portfolio_holdings)

    print(f"Portfolio Value: ${portfolio['summary']['total_value']:,.2f}")
    print(f"Total Cost: ${portfolio['summary']['total_cost']:,.2f}")
    print(f"P&L: ${portfolio['summary']['total_profit_loss']:,.2f}")
    print(f"P&L %: {portfolio['summary']['total_profit_loss_percentage']:.2f}%")

    # Get risk analysis
    allocation = api.get_allocation(portfolio_holdings)
    print(f"\nRisk Level: {allocation['risk_level']}")
    print(f"Diversification Score: {allocation['diversification_score']}/100")

    print("\nAllocation Breakdown:")
    for asset in allocation['allocation']:
        print(f"  {asset['name']}: {asset['percentage']:.2f}% (${asset['value']:,.2f})")

except Exception as e:
    print(f"Error: {e}")
```

## React Portfolio Dashboard

```jsx
import React, { useState, useEffect } from 'react';

const PortfolioDashboard = ({ apiKey }) => {
  const [portfolio, setPortfolio] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const holdings = [
    { id: 'bitcoin', amount: 1.5 },
    { id: 'ethereum', amount: 10 },
    { id: 'cardano', amount: 5000 }
  ];

  const fetchPortfolioData = async () => {
    setLoading(true);
    try {
      const [portfolioRes, allocationRes] = await Promise.all([
        fetch('/api/v1/portfolio/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          body: JSON.stringify({ holdings, base_currency: 'usd' })
        }),
        fetch('/api/v1/portfolio/allocation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          body: JSON.stringify({ holdings, base_currency: 'usd' })
        })
      ]);

      const portfolioData = await portfolioRes.json();
      const allocationData = await allocationRes.json();

      if (portfolioData.success) setPortfolio(portfolioData.data);
      if (allocationData.success) setAllocation(allocationData.data);

    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  if (loading) return <div>Loading portfolio...</div>;

  return (
    <div className="portfolio-dashboard">
      {portfolio && (
        <div className="portfolio-summary">
          <h2>Portfolio Summary</h2>
          <div className="summary-grid">
            <div className="metric">
              <h3>Total Value</h3>
              <p>${portfolio.summary.total_value.toLocaleString()}</p>
            </div>
            {portfolio.summary.total_profit_loss && (
              <div className="metric">
                <h3>P&L</h3>
                <p className={portfolio.summary.total_profit_loss > 0 ? 'profit' : 'loss'}>
                  ${portfolio.summary.total_profit_loss.toLocaleString()}
                  ({portfolio.summary.total_profit_loss_percentage.toFixed(2)}%)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {allocation && (
        <div className="allocation-analysis">
          <h2>Risk Analysis</h2>
          <div className="risk-metrics">
            <span className={`risk-level ${allocation.risk_level}`}>
              Risk: {allocation.risk_level.toUpperCase()}
            </span>
            <span>Diversification: {allocation.diversification_score}/100</span>
          </div>

          <div className="allocation-chart">
            {allocation.allocation.map(asset => (
              <div key={asset.id} className="allocation-item">
                <span className="asset-name">{asset.name}</span>
                <span className="asset-percentage">{asset.percentage.toFixed(2)}%</span>
                <span className="asset-value">${asset.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioDashboard;
```

---

# 🚨 Error Handling

## Authentication Errors

### Invalid API Key
```json
{
  "success": false,
  "error": "Invalid or inactive API key",
  "timestamp": "2025-01-01T00:00:00Z",
  "details": {
    "code": "INVALID_API_KEY",
    "message": "Please provide a valid API key or use the API without authentication for free tier access"
  }
}
```

### Feature Not Available
```json
{
  "success": false,
  "error": "Feature not available in your plan",
  "timestamp": "2025-01-01T00:00:00Z",
  "details": {
    "required_feature": "portfolio_basic",
    "current_plan": "free",
    "upgrade_info": "Upgrade to Basic plan ($5/mo) for portfolio endpoints and extended historical data"
  }
}
```

## Portfolio Validation Errors

### Invalid Holdings
```json
{
  "success": false,
  "error": "Validation failed",
  "timestamp": "2025-01-01T00:00:00Z",
  "details": {
    "validation_errors": [
      {
        "field": "holdings[0].amount",
        "message": "Amount must be a positive number"
      }
    ]
  }
}
```

### Coin Not Found
```json
{
  "success": false,
  "error": "Portfolio calculation failed: Coin not found",
  "timestamp": "2025-01-01T00:00:00Z"
}
```

---

# 🔧 Troubleshooting

## Common Issues

### Portfolio Returns Empty Data
**Problem:** Portfolio calculation succeeds but returns empty assets array.
**Solution:** Verify that all coin IDs in your holdings exist. Use `/crypto/list` to get valid coin IDs.

### Rate Limit Exceeded
**Problem:** Getting 429 errors frequently.
**Solution:**
- Check rate limit headers to see current usage
- Implement request caching
- Upgrade to higher tier plan
- Use batch endpoints when available

### Authentication Failed
**Problem:** Getting 401 errors with valid API key.
**Solution:**
- Verify API key is correctly formatted
- Check if API key is active
- Ensure proper header format: `X-API-Key: your_key`

## Performance Optimization

### Cache Portfolio Calculations
```javascript
// Cache results for 5 minutes
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function getCachedPortfolio(holdings, apiKey) {
  const cacheKey = JSON.stringify(holdings);
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await calculatePortfolio(holdings, apiKey);
  cache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}
```

### Batch Holdings Efficiently
```javascript
// Good: Single request for multiple coins
const holdings = [
  { id: 'bitcoin', amount: 1 },
  { id: 'ethereum', amount: 5 },
  { id: 'cardano', amount: 1000 }
];

// Bad: Multiple individual requests
// Don't do this - it wastes your rate limit
```

---

# 📊 API Limits & Usage

| Metric | Free | Basic | Pro | Ultra |
|--------|------|-------|-----|-------|
| Daily Requests | 100 | 333 | 3,333 | 16,666 |
| Hourly Requests | 25 | 50 | 200 | 1,000 |
| Portfolio Holdings | ❌ | 100 | 500 | 500 |
| Historical Data | 7 days | 90 days | 365 days | 3 years |
| Support Response | Community | 24h | 6h | 2h |

---

*This documentation covers the complete Crypto + FX Market API with portfolio management features. For the latest updates, visit [GitHub](https://github.com/Flexipie/CryptoAPI).*

**API Version:** 2.0.0
**Last Updated:** September 17, 2025
**Base URL:** https://cryptoapi-production-ad23.up.railway.app