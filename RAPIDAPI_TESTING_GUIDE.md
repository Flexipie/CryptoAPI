# 🧪 RapidAPI Testing & Optimization Guide

## Pre-Launch Testing Checklist

### 1. API Functionality Testing

**All 13 Endpoints Verification:**
```bash
# Test crypto endpoints
curl "https://your-railway-url.up.railway.app/api/v1/crypto/popular"
curl "https://your-railway-url.up.railway.app/api/v1/crypto/prices?ids=bitcoin,ethereum&vs_currencies=usd"
curl "https://your-railway-url.up.railway.app/api/v1/crypto/chart/bitcoin?days=7"
curl "https://your-railway-url.up.railway.app/api/v1/crypto/info/bitcoin"
curl "https://your-railway-url.up.railway.app/api/v1/crypto/list"

# Test forex endpoints
curl "https://your-railway-url.up.railway.app/api/v1/forex/rates"
curl "https://your-railway-url.up.railway.app/api/v1/forex/convert?from=USD&to=EUR&amount=100"
curl "https://your-railway-url.up.railway.app/api/v1/forex/historical?date=2024-01-01"
curl "https://your-railway-url.up.railway.app/api/v1/forex/currencies"

# Test health endpoints
curl "https://your-railway-url.up.railway.app/api/v1/health"
curl "https://your-railway-url.up.railway.app/api/v1/health/detailed"
curl "https://your-railway-url.up.railway.app/api/v1/ready"
curl "https://your-railway-url.up.railway.app/api/v1/live"
```

### 2. RapidAPI Header Testing

**Simulate RapidAPI Environment:**
```bash
# Test with RapidAPI headers
curl -H "X-RapidAPI-User: test-user" \
     -H "X-RapidAPI-Subscription: starter" \
     -H "X-RapidAPI-Proxy-Secret: test-secret" \
     "https://your-api-url.com/api/v1/crypto/popular"

# Verify subscription detection works
curl -H "X-RapidAPI-Subscription: enterprise" \
     "https://your-api-url.com/api/v1/crypto/popular"
```

### 3. Performance Testing

**Response Time Verification:**
```bash
# Create curl-format.txt
echo 'time_namelookup:  %{time_namelookup}\ntime_connect:     %{time_connect}\ntime_total:       %{time_total}\n' > curl-format.txt

# Test cached responses (<100ms target)
curl -w "@curl-format.txt" -s -o /dev/null "https://your-api-url.com/api/v1/crypto/popular"

# Test fresh requests (<500ms target)
curl -w "@curl-format.txt" -s -o /dev/null "https://your-api-url.com/api/v1/crypto/prices?ids=solana"
```

**Load Testing:**
```bash
# Install wrk
brew install wrk  # macOS
# apt-get install wrk  # Ubuntu

# Test API under load (simulating RapidAPI traffic)
wrk -t4 -c100 -d30s --header "X-RapidAPI-User: load-test" https://your-api-url.com/api/v1/health

# Test popular endpoint under load
wrk -t2 -c50 -d60s https://your-api-url.com/api/v1/crypto/popular
```

### 4. Error Handling Testing

**Network Failure Simulation:**
```bash
# Test when CoinGecko is down (simulate with invalid requests)
curl "https://your-api-url.com/api/v1/crypto/prices?ids=invalid-coin-id"

# Test when ECB is down
curl "https://your-api-url.com/api/v1/forex/historical?date=1999-01-01"

# Test rate limiting
for i in {1..20}; do
  curl "https://your-api-url.com/api/v1/health" &
done
wait
```

**Validation Testing:**
```bash
# Test invalid parameters
curl "https://your-api-url.com/api/v1/crypto/chart/bitcoin?days=invalid"
curl "https://your-api-url.com/api/v1/forex/convert?from=INVALID&to=USD&amount=100"
curl "https://your-api-url.com/api/v1/forex/convert?from=USD&to=EUR&amount=-100"
```

## RapidAPI Hub Testing

### 1. Import API Specification

1. **Test OpenAPI Import:**
   - URL: `https://your-railway-url.up.railway.app/docs/json`
   - Verify all 13 endpoints are imported
   - Check parameter validation
   - Confirm response schemas

2. **Manual Endpoint Verification:**
   - Test each endpoint in RapidAPI console
   - Verify request/response formats
   - Check error responses
   - Validate parameter descriptions

### 2. Subscription Tier Testing

**Free Tier (100 requests/month):**
```javascript
// Test in RapidAPI console with Free subscription
fetch('/crypto/popular', {
  headers: {
    'X-RapidAPI-Key': 'your-test-key',
    'X-RapidAPI-Host': 'your-api-host'
  }
})
.then(response => response.json())
.then(data => console.log('Free tier response:', data));
```

**Paid Tier Testing:**
- Test with each subscription level
- Verify rate limit differences
- Check priority processing
- Confirm premium features work

### 3. Documentation Testing

**Interactive Documentation:**
- Test all examples in Swagger UI
- Verify code samples work
- Check parameter descriptions
- Validate response examples

**RapidAPI Hub Documentation:**
- Verify main description renders correctly
- Test all code examples
- Check endpoint descriptions
- Validate pricing display

## Optimization Implementation

### 1. Enable Subscription Middleware

<function_calls>
<invoke name="Read">
<parameter name="file_path">/Users/flexipie/Desktop/Code/Projects/API/NewAPI/src/server.ts