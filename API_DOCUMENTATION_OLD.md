# 🚀 Crypto + FX Market API Documentation

A production-ready REST API providing real-time cryptocurrency prices and foreign exchange rates from trusted sources like CoinGecko and the European Central Bank.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Rate Limits](#rate-limits)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Cryptocurrency Endpoints](#cryptocurrency-endpoints)
- [Foreign Exchange Endpoints](#foreign-exchange-endpoints)
- [Health Check Endpoints](#health-check-endpoints)
- [Code Examples](#code-examples)
- [SDK & Libraries](#sdk--libraries)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

```bash
# Get popular cryptocurrencies
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/popular"

# Get Bitcoin price in USD and EUR
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/prices?ids=bitcoin&vs_currencies=usd,eur"

# Get detailed Bitcoin information
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/info/bitcoin"

# Check API health
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/health"
```

## 🌐 Base URL

**Production:** `https://cryptoapi-production-ad23.up.railway.app`

All endpoints are prefixed with `/api/v1/`

## 🔐 Authentication

**No authentication required!** This API is designed for ease of use with zero setup.

- ❌ No API keys needed
- ❌ No registration required
- ✅ Just make requests and get data

## ⚡ Rate Limits

- **Default:** 1000 requests per hour per IP
- **Burst:** 100 concurrent requests
- **Reset:** Hourly rolling window

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 2025-01-01T00:00:00Z
```

## 📊 Response Format

All responses follow a consistent JSON structure:

### Success Response
```json
{
  "success": true,
  "data": { /* your data here */ },
  "timestamp": "2025-01-01T00:00:00.000Z",
  "cache_hit": false
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message here",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "details": { /* optional error details */ }
}
```

## 🚨 Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| `200` | OK | Request successful |
| `400` | Bad Request | Invalid parameters |
| `404` | Not Found | Resource not found |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server error |
| `503` | Service Unavailable | External service down |

### Common Error Types

```json
{
  "success": false,
  "error": "Validation failed",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "details": {
    "validation_errors": [
      {
        "field": "ids",
        "message": "must have required property 'ids'"
      }
    ]
  }
}
```

---

# 💰 Cryptocurrency Endpoints

## 1. Get Popular Cryptocurrencies

Get the top 10 most popular cryptocurrencies with current market data.

### Endpoint
```
GET /api/v1/crypto/popular
```

### Parameters
None required.

### Example Request
```bash
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/popular"
```

### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "bitcoin",
      "symbol": "bitcoin",
      "name": "Bitcoin",
      "current_price": 115327,
      "market_cap": 2296530940744.2983,
      "total_volume": 38568361735.90781,
      "price_change_24h": 0.327033100129005,
      "price_change_percentage_24h": 0.327033100129005,
      "last_updated": "2025-01-01T00:00:00.000Z",
      "vs_currency": "usd"
    }
    // ... 9 more coins
  ],
  "timestamp": "2025-01-01T00:00:00.000Z",
  "cache_hit": false
}
```

### Response Fields
- `id`: Unique coin identifier
- `symbol`: Coin symbol
- `name`: Display name
- `current_price`: Current price in USD
- `market_cap`: Total market capitalization
- `total_volume`: 24h trading volume
- `price_change_24h`: 24h price change (absolute)
- `price_change_percentage_24h`: 24h price change (percentage)
- `last_updated`: Data last updated timestamp
- `vs_currency`: Currency denomination

---

## 2. Get Specific Cryptocurrency Prices

Get current prices for specific cryptocurrencies in multiple currencies.

### Endpoint
```
GET /api/v1/crypto/prices
```

### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `ids` | string | ✅ Yes | Comma-separated coin IDs | `bitcoin,ethereum` |
| `vs_currencies` | string | ❌ No | Comma-separated currencies | `usd,eur,btc` |

### Supported Coin IDs
Use the `/crypto/list` endpoint to get all supported coins. Popular ones include:
- `bitcoin`, `ethereum`, `binancecoin`, `ripple`, `cardano`, `solana`, `dogecoin`, `polkadot`, `avalanche-2`, `chainlink`

### Supported Currencies
- **Fiat:** `usd`, `eur`, `gbp`, `jpy`, `cny`, `krw`, `inr`, `cad`, `aud`, `sgd`, etc.
- **Crypto:** `btc`, `eth`, `bnb`, `xrp`, `ada`, `sol`, `dot`, etc.

### Example Requests

```bash
# Single coin, single currency
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/prices?ids=bitcoin&vs_currencies=usd"

# Multiple coins, multiple currencies
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/prices?ids=bitcoin,ethereum,cardano&vs_currencies=usd,eur"

# All major coins in Bitcoin
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/prices?ids=ethereum,cardano,solana&vs_currencies=btc"
```

### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "bitcoin",
      "symbol": "bitcoin",
      "name": "Bitcoin",
      "current_price": 115327,
      "market_cap": 2296530940744.2983,
      "total_volume": 38568361735.90781,
      "price_change_24h": 0.327033100129005,
      "price_change_percentage_24h": 0.327033100129005,
      "last_updated": "2025-01-01T00:00:00.000Z",
      "vs_currency": "usd"
    },
    {
      "id": "bitcoin",
      "symbol": "bitcoin",
      "name": "Bitcoin",
      "current_price": 97695,
      "market_cap": 1945825404252.297,
      "total_volume": 32671683478.466602,
      "price_change_24h": -0.0675715892611087,
      "price_change_percentage_24h": -0.0675715892611087,
      "last_updated": "2025-01-01T00:00:00.000Z",
      "vs_currency": "eur"
    }
  ],
  "timestamp": "2025-01-01T00:00:00.000Z",
  "cache_hit": false
}
```

### Error Examples
```json
// Missing required parameter
{
  "success": false,
  "error": "Validation failed",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "details": {
    "validation_errors": [
      {
        "instancePath": "",
        "message": "must have required property 'ids'"
      }
    ]
  }
}
```

---

## 3. Get Historical Market Chart

Get historical price data for a cryptocurrency over time.

### Endpoint
```
GET /api/v1/crypto/chart/{id}
```

### Parameters

| Parameter | Type | Required | Description | Default | Example |
|-----------|------|----------|-------------|---------|---------|
| `id` | string | ✅ Yes | Coin ID (path parameter) | - | `bitcoin` |
| `vs_currency` | string | ❌ No | Target currency | `usd` | `usd`, `eur` |
| `days` | string | ❌ No | Data range in days | `7` | `1`, `7`, `30`, `365` |

### Supported Days Values
- `1` - Last 24 hours (5 minute intervals)
- `7` - Last 7 days (hourly intervals)
- `30` - Last 30 days (hourly intervals)
- `90` - Last 90 days (daily intervals)
- `365` - Last 365 days (daily intervals)

### Example Requests

```bash
# Bitcoin price chart for last 7 days in USD
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/chart/bitcoin?vs_currency=usd&days=7"

# Ethereum price chart for last 30 days in EUR
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/chart/ethereum?vs_currency=eur&days=30"

# Default parameters (7 days, USD)
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/chart/bitcoin"
```

### Example Response
```json
{
  "success": true,
  "data": {
    "prices": [
      [1704067200000, 42950.12],
      [1704070800000, 42875.45],
      [1704074400000, 43125.78]
      // ... more price points
    ],
    "market_caps": [
      [1704067200000, 841234567890.12],
      [1704070800000, 841456789012.34]
      // ... more market cap points
    ],
    "total_volumes": [
      [1704067200000, 15234567890.12],
      [1704070800000, 15456789012.34]
      // ... more volume points
    ]
  },
  "timestamp": "2025-01-01T00:00:00.000Z",
  "cache_hit": false
}
```

### Response Fields
- `prices`: Array of `[timestamp, price]` pairs
- `market_caps`: Array of `[timestamp, market_cap]` pairs
- `total_volumes`: Array of `[timestamp, volume]` pairs
- Timestamps are in Unix milliseconds

---

## 4. Get Detailed Coin Information

Get comprehensive information about a specific cryptocurrency including description, market data, and metadata.

### Endpoint
```
GET /api/v1/crypto/info/{id}
```

### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `id` | string | ✅ Yes | Coin ID (path parameter) | `bitcoin` |

### Example Requests

```bash
# Get Bitcoin information
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/info/bitcoin"

# Get Ethereum information
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/info/ethereum"

# Get Cardano information
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/info/cardano"
```

### Example Response
```json
{
  "success": true,
  "data": {
    "id": "bitcoin",
    "symbol": "btc",
    "name": "Bitcoin",
    "description": "Bitcoin is the first successful internet money based on peer-to-peer technology...",
    "image": {
      "thumb": "https://coin-images.coingecko.com/coins/images/1/thumb/bitcoin.png",
      "small": "https://coin-images.coingecko.com/coins/images/1/small/bitcoin.png",
      "large": "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png"
    },
    "market_cap_rank": 1,
    "market_data": {
      "current_price": {
        "usd": 115327,
        "eur": 97735,
        "btc": 1,
        "eth": 25.626679
        // ... 50+ currencies
      },
      "market_cap": {
        "usd": 2296530940744,
        "eur": 1946245772120
        // ... all currencies
      },
      "total_volume": {
        "usd": 38471359571,
        "eur": 32596244366
        // ... all currencies
      },
      "high_24h": {
        "usd": 115995,
        "eur": 98473
      },
      "low_24h": {
        "usd": 114509,
        "eur": 97330
      },
      "price_change_24h": 396.962,
      "price_change_percentage_24h": 0.34532,
      "circulating_supply": 19921659,
      "total_supply": 19921659,
      "max_supply": 21000000
    },
    "categories": [
      "Smart Contract Platform",
      "Layer 1 (L1)",
      "Proof of Work (PoW)",
      "Bitcoin Ecosystem"
    ],
    "last_updated": "2025-01-01T00:00:00.000Z"
  },
  "timestamp": "2025-01-01T00:00:00.000Z",
  "cache_hit": false
}
```

### Response Fields

#### Basic Information
- `id`: Unique coin identifier
- `symbol`: Official coin symbol
- `name`: Full coin name
- `description`: Detailed description of the project
- `market_cap_rank`: Market cap ranking position

#### Images
- `image.thumb`: 64x64px image
- `image.small`: 128x128px image
- `image.large`: 256x256px image

#### Market Data (Available in 50+ Currencies)
- `current_price`: Real-time price data
- `market_cap`: Total market capitalization
- `total_volume`: 24-hour trading volume
- `high_24h`: 24-hour high price
- `low_24h`: 24-hour low price
- `price_change_24h`: Absolute price change (24h)
- `price_change_percentage_24h`: Percentage price change (24h)
- `circulating_supply`: Circulating token supply
- `total_supply`: Total token supply
- `max_supply`: Maximum possible supply

#### Metadata
- `categories`: Project categories/tags
- `last_updated`: When data was last updated

---

## 5. Get Supported Coins List

Get a complete list of all supported cryptocurrencies (18,000+).

### Endpoint
```
GET /api/v1/crypto/list
```

### Parameters
None required.

### Example Request
```bash
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/crypto/list"
```

### Example Response
```json
{
  "success": true,
  "data": [
    {
      "id": "bitcoin",
      "symbol": "btc",
      "name": "Bitcoin"
    },
    {
      "id": "ethereum",
      "symbol": "eth",
      "name": "Ethereum"
    },
    {
      "id": "binancecoin",
      "symbol": "bnb",
      "name": "BNB"
    }
    // ... 18,000+ more coins
  ],
  "timestamp": "2025-01-01T00:00:00.000Z",
  "cache_hit": true
}
```

### Use Cases
- Get coin IDs for use in other endpoints
- Build cryptocurrency selection dropdowns
- Validate coin existence before API calls
- Cache locally for offline coin lookup

---

# 💱 Foreign Exchange Endpoints

## 1. Get Current Exchange Rates

Get current exchange rates from the European Central Bank for major world currencies.

### Endpoint
```
GET /api/v1/forex/rates
```

### Parameters
None required.

### Example Request
```bash
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/forex/rates"
```

### Example Response
```json
{
  "success": true,
  "data": {
    "base": "EUR",
    "date": "2025-01-01",
    "rates": {
      "USD": 1.1234,
      "GBP": 0.8567,
      "JPY": 123.45,
      "CHF": 1.0234,
      "CAD": 1.4567,
      "AUD": 1.5678,
      "CNY": 7.1234,
      "KRW": 1234.56,
      "INR": 82.34,
      "SGD": 1.4321,
      "HKD": 8.7654,
      "NOK": 9.8765,
      "SEK": 10.123,
      "DKK": 7.4321,
      "PLN": 4.1234,
      "CZK": 23.456,
      "HUF": 345.67,
      "RON": 4.8765,
      "BGN": 1.9558,
      "HRK": 7.5234,
      "RUB": 85.432,
      "TRY": 18.765,
      "BRL": 5.4321,
      "MXN": 19.876,
      "ZAR": 18.234,
      "NZD": 1.6789,
      "THB": 35.432,
      "MYR": 4.6789,
      "IDR": 15432.1,
      "PHP": 56.789
    }
  },
  "timestamp": "2025-01-01T00:00:00.000Z",
  "cache_hit": false
}
```

### Response Fields
- `base`: Base currency (always EUR)
- `date`: Rate publication date
- `rates`: Exchange rates relative to EUR

### Supported Currencies
30+ major world currencies including USD, GBP, JPY, CHF, CAD, AUD, CNY, KRW, INR, SGD, and more.

---

## 2. Convert Currency Amounts

Convert amounts between supported currencies using current exchange rates.

### Endpoint
```
GET /api/v1/forex/convert
```

### Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `from` | string | ✅ Yes | Source currency code | `USD` |
| `to` | string | ✅ Yes | Target currency code | `EUR` |
| `amount` | number | ✅ Yes | Amount to convert | `100` |

### Example Requests

```bash
# Convert $100 USD to EUR
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/forex/convert?from=USD&to=EUR&amount=100"

# Convert €50 EUR to Japanese Yen
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/forex/convert?from=EUR&to=JPY&amount=50"

# Convert £200 GBP to USD
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/forex/convert?from=GBP&to=USD&amount=200"
```

### Example Response
```json
{
  "success": true,
  "data": {
    "from": "USD",
    "to": "EUR",
    "amount": 100,
    "converted_amount": 89.04,
    "rate": 0.8904,
    "date": "2025-01-01",
    "timestamp": "2025-01-01T00:00:00.000Z"
  },
  "timestamp": "2025-01-01T00:00:00.000Z",
  "cache_hit": false
}
```

### Response Fields
- `from`: Source currency
- `to`: Target currency
- `amount`: Original amount
- `converted_amount`: Converted amount
- `rate`: Exchange rate used
- `date`: Rate date
- `timestamp`: Conversion timestamp

### Error Examples
```json
// Invalid currency
{
  "success": false,
  "error": "Currency not found: XXX",
  "timestamp": "2025-01-01T00:00:00.000Z"
}

// Negative amount
{
  "success": false,
  "error": "Amount must be positive",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

---

## 3. Get Historical Exchange Rates

Get historical exchange rates for up to 90 days in the past.

### Endpoint
```
GET /api/v1/forex/historical
```

### Parameters

| Parameter | Type | Required | Description | Default | Example |
|-----------|------|----------|-------------|---------|---------|
| `date` | string | ❌ No | Specific date (YYYY-MM-DD) | - | `2024-12-25` |
| `days` | number | ❌ No | Number of days back | `7` | `30` |

### Example Requests

```bash
# Get rates for specific date
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/forex/historical?date=2024-12-25"

# Get rates for last 30 days
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/forex/historical?days=30"

# Default: last 7 days
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/forex/historical"
```

### Example Response
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-12-25",
      "base": "EUR",
      "rates": {
        "USD": 1.1198,
        "GBP": 0.8543,
        "JPY": 122.87
        // ... all currencies
      }
    },
    {
      "date": "2024-12-24",
      "base": "EUR",
      "rates": {
        "USD": 1.1187,
        "GBP": 0.8539,
        "JPY": 122.93
        // ... all currencies
      }
    }
    // ... more historical data
  ],
  "timestamp": "2025-01-01T00:00:00.000Z",
  "cache_hit": false
}
```

### Use Cases
- Historical rate analysis
- Rate trend calculation
- Financial reporting
- Currency charts and graphs

---

## 4. Get Supported Currencies

Get a list of all supported fiat currencies.

### Endpoint
```
GET /api/v1/forex/currencies
```

### Parameters
None required.

### Example Request
```bash
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/forex/currencies"
```

### Example Response
```json
{
  "success": true,
  "data": [
    {
      "code": "USD",
      "name": "US Dollar",
      "symbol": "$"
    },
    {
      "code": "EUR",
      "name": "Euro",
      "symbol": "€"
    },
    {
      "code": "GBP",
      "name": "British Pound Sterling",
      "symbol": "£"
    },
    {
      "code": "JPY",
      "name": "Japanese Yen",
      "symbol": "¥"
    }
    // ... 30+ more currencies
  ],
  "timestamp": "2025-01-01T00:00:00.000Z",
  "cache_hit": true
}
```

---

# ❤️ Health Check Endpoints

## 1. Basic Health Check

Simple endpoint to verify API availability.

### Endpoint
```
GET /api/v1/health
```

### Example Request
```bash
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/health"
```

### Example Response
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "uptime": 86400.123
  },
  "timestamp": "2025-01-01T00:00:00.000Z",
  "cache_hit": false
}
```

## 2. Detailed Health Check

Comprehensive health information including external service status.

### Endpoint
```
GET /api/v1/health/detailed
```

### Example Request
```bash
curl "https://cryptoapi-production-ad23.up.railway.app/api/v1/health/detailed"
```

### Example Response
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "uptime": 86400.123,
    "version": "1.0.0",
    "environment": "production",
    "services": {
      "coingecko": "healthy",
      "ecb": "healthy",
      "cache": "healthy"
    },
    "performance": {
      "avg_response_time": 250,
      "memory_usage": "45.2MB",
      "cpu_usage": "2.1%"
    }
  },
  "timestamp": "2025-01-01T00:00:00.000Z",
  "cache_hit": false
}
```

## 3. Readiness Probe

Kubernetes/Docker readiness probe endpoint.

### Endpoint
```
GET /api/v1/ready
```

Returns `200 OK` when service is ready to accept traffic.

## 4. Liveness Probe

Kubernetes/Docker liveness probe endpoint.

### Endpoint
```
GET /api/v1/live
```

Returns `200 OK` when service is alive and running.

---

# 💻 Code Examples

## JavaScript/Node.js

### Basic Usage
```javascript
const API_BASE = 'https://cryptoapi-production-ad23.up.railway.app/api/v1';

// Get popular cryptocurrencies
async function getPopularCrypto() {
  const response = await fetch(`${API_BASE}/crypto/popular`);
  const data = await response.json();

  if (data.success) {
    console.log('Popular cryptos:', data.data);
  } else {
    console.error('Error:', data.error);
  }
}

// Get specific coin prices
async function getCoinPrices(coinIds, currencies = ['usd']) {
  const params = new URLSearchParams({
    ids: coinIds.join(','),
    vs_currencies: currencies.join(',')
  });

  const response = await fetch(`${API_BASE}/crypto/prices?${params}`);
  const data = await response.json();

  return data.success ? data.data : null;
}

// Usage
getPopularCrypto();
getCoinPrices(['bitcoin', 'ethereum'], ['usd', 'eur']).then(console.log);
```

### Advanced Usage with Error Handling
```javascript
class CryptoFXAPI {
  constructor(baseUrl = 'https://cryptoapi-production-ad23.up.railway.app/api/v1') {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, params = {}) {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          url.searchParams.append(key, value.join(','));
        } else if (value !== undefined) {
          url.searchParams.append(key, value);
        }
      });

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data.success ? data.data : null;
    } catch (error) {
      console.error('API Error:', error.message);
      throw error;
    }
  }

  // Crypto methods
  async getPopular() {
    return this.request('/crypto/popular');
  }

  async getPrices(ids, currencies = ['usd']) {
    return this.request('/crypto/prices', { ids, vs_currencies: currencies });
  }

  async getCoinInfo(id) {
    return this.request(`/crypto/info/${id}`);
  }

  async getChart(id, days = 7, currency = 'usd') {
    return this.request(`/crypto/chart/${id}`, { days, vs_currency: currency });
  }

  // Forex methods
  async getForexRates() {
    return this.request('/forex/rates');
  }

  async convertCurrency(from, to, amount) {
    return this.request('/forex/convert', { from, to, amount });
  }

  // Health check
  async getHealth() {
    return this.request('/health');
  }
}

// Usage
const api = new CryptoFXAPI();

// Get Bitcoin info and price chart
async function bitcoinAnalysis() {
  try {
    const [info, chart, prices] = await Promise.all([
      api.getCoinInfo('bitcoin'),
      api.getChart('bitcoin', 30),
      api.getPrices(['bitcoin'], ['usd', 'eur', 'btc'])
    ]);

    console.log('Bitcoin Info:', info);
    console.log('30-day Chart:', chart.prices.length, 'data points');
    console.log('Current Prices:', prices);
  } catch (error) {
    console.error('Bitcoin analysis failed:', error);
  }
}

bitcoinAnalysis();
```

## Python

### Basic Usage
```python
import requests
import json

API_BASE = 'https://cryptoapi-production-ad23.up.railway.app/api/v1'

def get_popular_crypto():
    """Get popular cryptocurrencies"""
    response = requests.get(f'{API_BASE}/crypto/popular')
    data = response.json()

    if data['success']:
        return data['data']
    else:
        raise Exception(data['error'])

def get_crypto_prices(coin_ids, currencies=['usd']):
    """Get specific cryptocurrency prices"""
    params = {
        'ids': ','.join(coin_ids),
        'vs_currencies': ','.join(currencies)
    }

    response = requests.get(f'{API_BASE}/crypto/prices', params=params)
    data = response.json()

    if not data['success']:
        raise Exception(data['error'])

    return data['data']

def convert_currency(from_currency, to_currency, amount):
    """Convert between currencies"""
    params = {
        'from': from_currency,
        'to': to_currency,
        'amount': amount
    }

    response = requests.get(f'{API_BASE}/forex/convert', params=params)
    data = response.json()

    if not data['success']:
        raise Exception(data['error'])

    return data['data']

# Usage examples
if __name__ == '__main__':
    # Get popular cryptocurrencies
    popular = get_popular_crypto()
    print(f"Found {len(popular)} popular cryptocurrencies")

    # Get Bitcoin and Ethereum prices in USD and EUR
    prices = get_crypto_prices(['bitcoin', 'ethereum'], ['usd', 'eur'])
    for price in prices:
        print(f"{price['name']}: {price['current_price']} {price['vs_currency'].upper()}")

    # Convert $1000 USD to EUR
    conversion = convert_currency('USD', 'EUR', 1000)
    print(f"$1000 USD = €{conversion['converted_amount']:.2f} EUR")
```

### Advanced Python Class
```python
import requests
from typing import List, Dict, Optional, Union
from datetime import datetime

class CryptoFXAPI:
    def __init__(self, base_url: str = 'https://cryptoapi-production-ad23.up.railway.app/api/v1'):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CryptoFX-Python-Client/1.0'
        })

    def _request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make API request with error handling"""
        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            if not data.get('success', False):
                raise Exception(data.get('error', 'API request failed'))

            return data['data']

        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {str(e)}")
        except ValueError as e:
            raise Exception(f"Invalid JSON response: {str(e)}")

    # Cryptocurrency methods
    def get_popular(self) -> List[Dict]:
        """Get top 10 popular cryptocurrencies"""
        return self._request('/crypto/popular')

    def get_prices(self, coin_ids: List[str], currencies: List[str] = ['usd']) -> List[Dict]:
        """Get prices for specific coins in specific currencies"""
        params = {
            'ids': ','.join(coin_ids),
            'vs_currencies': ','.join(currencies)
        }
        return self._request('/crypto/prices', params)

    def get_coin_info(self, coin_id: str) -> Dict:
        """Get detailed information about a coin"""
        return self._request(f'/crypto/info/{coin_id}')

    def get_chart(self, coin_id: str, days: int = 7, currency: str = 'usd') -> Dict:
        """Get historical price chart data"""
        params = {
            'vs_currency': currency,
            'days': str(days)
        }
        return self._request(f'/crypto/chart/{coin_id}', params)

    def get_coins_list(self) -> List[Dict]:
        """Get list of all supported coins"""
        return self._request('/crypto/list')

    # Forex methods
    def get_forex_rates(self) -> Dict:
        """Get current forex rates"""
        return self._request('/forex/rates')

    def convert_currency(self, from_currency: str, to_currency: str, amount: float) -> Dict:
        """Convert amount between currencies"""
        params = {
            'from': from_currency.upper(),
            'to': to_currency.upper(),
            'amount': amount
        }
        return self._request('/forex/convert', params)

    def get_historical_rates(self, days: int = 7) -> List[Dict]:
        """Get historical forex rates"""
        params = {'days': days}
        return self._request('/forex/historical', params)

    def get_supported_currencies(self) -> List[Dict]:
        """Get list of supported currencies"""
        return self._request('/forex/currencies')

    # Health check
    def get_health(self) -> Dict:
        """Get API health status"""
        return self._request('/health')

    def get_detailed_health(self) -> Dict:
        """Get detailed API health information"""
        return self._request('/health/detailed')

# Usage example
def main():
    api = CryptoFXAPI()

    # Portfolio tracking example
    portfolio = [
        {'coin': 'bitcoin', 'amount': 0.5},
        {'coin': 'ethereum', 'amount': 2.0},
        {'coin': 'cardano', 'amount': 1000.0}
    ]

    # Get current prices
    coin_ids = [item['coin'] for item in portfolio]
    prices = api.get_prices(coin_ids, ['usd', 'eur'])

    # Calculate portfolio value
    price_map = {price['id']: price for price in prices}
    total_usd = 0
    total_eur = 0

    print("Portfolio Analysis:")
    print("-" * 50)

    for item in portfolio:
        coin = item['coin']
        amount = item['amount']

        if coin in price_map:
            usd_price = next(p['current_price'] for p in prices if p['id'] == coin and p['vs_currency'] == 'usd')
            eur_price = next(p['current_price'] for p in prices if p['id'] == coin and p['vs_currency'] == 'eur')

            usd_value = amount * usd_price
            eur_value = amount * eur_price

            total_usd += usd_value
            total_eur += eur_value

            print(f"{coin.capitalize()}: {amount} coins")
            print(f"  Value: ${usd_value:,.2f} USD / €{eur_value:,.2f} EUR")
            print()

    print(f"Total Portfolio Value:")
    print(f"  ${total_usd:,.2f} USD")
    print(f"  €{total_eur:,.2f} EUR")

if __name__ == '__main__':
    main()
```

## cURL Examples

### Cryptocurrency Endpoints
```bash
#!/bin/bash

API_BASE="https://cryptoapi-production-ad23.up.railway.app/api/v1"

# Get popular cryptocurrencies
echo "=== Popular Cryptocurrencies ==="
curl -s "$API_BASE/crypto/popular" | jq '.data[:3]'

# Get Bitcoin and Ethereum prices
echo -e "\n=== BTC & ETH Prices ==="
curl -s "$API_BASE/crypto/prices?ids=bitcoin,ethereum&vs_currencies=usd,eur" | jq '.data'

# Get detailed Bitcoin information
echo -e "\n=== Bitcoin Information ==="
curl -s "$API_BASE/crypto/info/bitcoin" | jq '.data | {name, symbol, description: .description[:200], market_cap_rank, "current_price_usd": .market_data.current_price.usd}'

# Get Bitcoin 30-day price chart
echo -e "\n=== Bitcoin 30-day Chart ==="
curl -s "$API_BASE/crypto/chart/bitcoin?days=30" | jq '.data.prices | length'

# Get supported coins (first 5)
echo -e "\n=== Supported Coins (First 5) ==="
curl -s "$API_BASE/crypto/list" | jq '.data[:5]'
```

### Forex Endpoints
```bash
#!/bin/bash

API_BASE="https://cryptoapi-production-ad23.up.railway.app/api/v1"

# Get current forex rates
echo "=== Current Forex Rates ==="
curl -s "$API_BASE/forex/rates" | jq '.data.rates | {USD, GBP, JPY, CHF}'

# Convert currencies
echo -e "\n=== Currency Conversions ==="
curl -s "$API_BASE/forex/convert?from=USD&to=EUR&amount=1000" | jq '.data'
curl -s "$API_BASE/forex/convert?from=GBP&to=JPY&amount=100" | jq '.data'

# Get historical rates (last 7 days)
echo -e "\n=== Historical Rates (Last 7 Days) ==="
curl -s "$API_BASE/forex/historical?days=7" | jq '.data | length'

# Get supported currencies
echo -e "\n=== Supported Currencies ==="
curl -s "$API_BASE/forex/currencies" | jq '.data[:5]'
```

### Health Check
```bash
#!/bin/bash

API_BASE="https://cryptoapi-production-ad23.up.railway.app/api/v1"

# Basic health check
echo "=== Basic Health ==="
curl -s "$API_BASE/health" | jq '.'

# Detailed health check
echo -e "\n=== Detailed Health ==="
curl -s "$API_BASE/health/detailed" | jq '.'

# Readiness probe
echo -e "\n=== Readiness Check ==="
curl -s -o /dev/null -w "%{http_code}" "$API_BASE/ready"
echo

# Liveness probe
echo -e "\n=== Liveness Check ==="
curl -s -o /dev/null -w "%{http_code}" "$API_BASE/live"
echo
```

---

# 📚 SDK & Libraries

## Official Libraries

Currently, official SDKs are planned for:
- **JavaScript/TypeScript** (npm package)
- **Python** (PyPI package)
- **Go** (Go module)
- **Rust** (Crates.io)

## Community Libraries

We welcome community contributions! If you build a library for this API, please let us know.

## HTTP Client Recommendations

### JavaScript
- **fetch()** (built-in)
- **axios** - `npm install axios`
- **undici** - `npm install undici`

### Python
- **requests** - `pip install requests`
- **httpx** - `pip install httpx`
- **aiohttp** - `pip install aiohttp`

### Go
- **net/http** (built-in)
- **resty** - `go get github.com/go-resty/resty/v2`

### Rust
- **reqwest** - `cargo add reqwest`
- **ureq** - `cargo add ureq`

---

# 🔧 Troubleshooting

## Common Issues

### 400 Bad Request - Missing Parameters
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "validation_errors": [
      {
        "instancePath": "",
        "message": "must have required property 'ids'"
      }
    ]
  }
}
```

**Solution:** Check that all required parameters are included in your request.

### 404 Not Found - Invalid Coin ID
```json
{
  "success": false,
  "error": "Coin not found: invalid-coin"
}
```

**Solution:** Use `/crypto/list` to get valid coin IDs.

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "details": {
    "limit": 1000,
    "window": "3600000ms",
    "remaining": 0,
    "reset": "2025-01-01T01:00:00.000Z"
  }
}
```

**Solutions:**
- Wait for rate limit reset
- Implement request throttling
- Cache responses when possible
- Consider upgrading to higher rate limits

### 503 Service Unavailable
```json
{
  "success": false,
  "error": "External service is currently unavailable. Please try again later."
}
```

**Causes:**
- CoinGecko API temporarily down
- European Central Bank service unavailable
- Network connectivity issues

**Solutions:**
- Retry request after a few minutes
- Implement exponential backoff
- Check API status page

## Best Practices

### 1. Implement Proper Error Handling
```javascript
async function safeApiCall(apiFunction) {
  try {
    return await apiFunction();
  } catch (error) {
    if (error.message.includes('rate limit')) {
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 60000));
      return await apiFunction();
    } else if (error.message.includes('503')) {
      // Service unavailable, retry with backoff
      await new Promise(resolve => setTimeout(resolve, 5000));
      return await apiFunction();
    } else {
      throw error;
    }
  }
}
```

### 2. Cache Responses Locally
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedData(key, fetchFunction) {
  const cached = cache.get(key);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await fetchFunction();
  cache.set(key, {
    data,
    timestamp: Date.now()
  });

  return data;
}
```

### 3. Use Batch Requests When Possible
```javascript
// Good: Single request for multiple coins
const prices = await api.getPrices(['bitcoin', 'ethereum', 'cardano'], ['usd', 'eur']);

// Bad: Multiple individual requests
// const btc = await api.getPrices(['bitcoin'], ['usd', 'eur']);
// const eth = await api.getPrices(['ethereum'], ['usd', 'eur']);
// const ada = await api.getPrices(['cardano'], ['usd', 'eur']);
```

### 4. Monitor API Health
```javascript
async function checkApiHealth() {
  try {
    const health = await api.getHealth();
    console.log('API Status:', health.status);
    return health.status === 'healthy';
  } catch (error) {
    console.error('API Health Check Failed:', error);
    return false;
  }
}

// Check health before making important requests
if (await checkApiHealth()) {
  const data = await api.getPopular();
}
```

## Performance Tips

1. **Use appropriate endpoints**: `/crypto/popular` vs `/crypto/prices?ids=...`
2. **Limit currency selections**: Only request currencies you need
3. **Cache aggressively**: Crypto prices change frequently but not every second
4. **Batch requests**: Combine multiple coin requests into single calls
5. **Monitor rate limits**: Track remaining requests in response headers

## Support

### Community Support
- **GitHub Issues**: [Report bugs and request features](https://github.com/Flexipie/CryptoAPI/issues)
- **Documentation**: This comprehensive guide
- **Examples**: See code examples above

### API Status
- **Uptime**: 99.9% target uptime
- **Status Page**: Check API health endpoints
- **Maintenance**: Scheduled maintenance announced in advance

---

## 📊 API Limits & Quotas

| Metric | Value | Notes |
|--------|--------|-------|
| Rate Limit | 1000 req/hour | Per IP address |
| Burst Limit | 100 concurrent | Temporary spikes allowed |
| Request Timeout | 30 seconds | Maximum response time |
| Response Size | 10MB max | Automatic pagination for large responses |
| Cache TTL | 5 minutes | Crypto data cache duration |
| Historical Data | 365 days | Maximum lookback period |

---

*This documentation covers all aspects of the Crypto + FX Market API. For the latest updates and announcements, please check our [GitHub repository](https://github.com/Flexipie/CryptoAPI).*

**API Version:** 1.0.0
**Last Updated:** September 16, 2025
**Base URL:** https://cryptoapi-production-ad23.up.railway.app