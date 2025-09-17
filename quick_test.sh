#!/bin/bash

# Quick focused test of key endpoints
BASE_URL="http://localhost:3000"
FREE_KEY="demo_free_key"
BASIC_KEY="demo_basic_key"
PRO_KEY="demo_pro_key"

echo "🚀 Quick API Test"
echo "================="

# Test 1: Health Check
echo "1. Health Check:"
curl -s "$BASE_URL/api/v1/health" | jq -c .
sleep 1

# Test 2: Basic Crypto Price (No Auth)
echo -e "\n2. Basic Crypto Price (No Auth):"
curl -s "$BASE_URL/api/v1/crypto/prices?ids=bitcoin" | jq -c '.data[0] | {id, name, current_price}'
sleep 1

# Test 3: Authentication Test (Free Tier)
echo -e "\n3. Free Tier Auth:"
curl -s -H "X-API-Key: $FREE_KEY" "$BASE_URL/api/v1/crypto/prices?ids=ethereum" | jq -c '.data[0] | {id, name, current_price}'
sleep 1

# Test 4: Portfolio Access (Free Tier - Should Fail)
echo -e "\n4. Portfolio Access (Free Tier - Should Fail):"
curl -s -X POST -H "Content-Type: application/json" -H "X-API-Key: $FREE_KEY" \
  "$BASE_URL/api/v1/portfolio/value" \
  -d '{"holdings": [{"id": "bitcoin", "amount": 0.1}], "base_currency": "usd"}' | jq -c .
sleep 1

# Test 5: Portfolio Access (Pro Tier - Should Work)
echo -e "\n5. Portfolio Calculate (Pro Tier - Should Work):"
curl -s -X POST -H "Content-Type: application/json" -H "X-API-Key: $PRO_KEY" \
  "$BASE_URL/api/v1/portfolio/calculate" \
  -d '{"holdings": [{"id": "bitcoin", "amount": 1, "cost_basis": 50000}], "base_currency": "usd"}' | jq -c '.data.summary | {total_value, total_profit_loss}'
sleep 1

# Test 6: Rate Limiting Headers
echo -e "\n6. Rate Limiting Headers (Basic Tier):"
curl -s -I -H "X-API-Key: $BASIC_KEY" "$BASE_URL/api/v1/crypto/prices?ids=bitcoin" | grep -E "x-ratelimit|HTTP"
sleep 1

# Test 7: Forex Endpoint
echo -e "\n7. Forex Conversion:"
curl -s "$BASE_URL/api/v1/forex/convert?from=USD&to=EUR&amount=100" | jq -c '.data | {converted_amount, exchange_rate}'
sleep 1

# Test 8: Documentation
echo -e "\n8. Documentation Available:"
curl -s -I "$BASE_URL/docs" | grep "HTTP"

echo -e "\n✅ Quick test complete!"