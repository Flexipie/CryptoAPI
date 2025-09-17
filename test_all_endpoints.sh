#!/bin/bash

# Comprehensive API Testing Script
# Tests all endpoints with different authentication levels and parameters

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL (change this to your Railway deployment URL when testing production)
BASE_URL="http://localhost:3000"

# API Keys for different tiers
FREE_KEY="demo_free_key"
BASIC_KEY="demo_basic_key"
PRO_KEY="demo_pro_key"
ULTRA_KEY="demo_ultra_key"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test and check result
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_status="$3"

    echo -e "${BLUE}Testing: $test_name${NC}"

    # Run the command and capture both response and HTTP status
    response=$(eval "$command" 2>/dev/null)
    status_code=$(eval "$command -w '%{http_code}' -s -o /dev/null" 2>/dev/null)

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} - Status: $status_code"
        ((TESTS_PASSED++))
        if [ -n "$response" ] && command -v jq >/dev/null 2>&1; then
            echo "$response" | jq -C . 2>/dev/null || echo "$response"
        fi
    else
        echo -e "${RED}✗ FAIL${NC} - Expected: $expected_status, Got: $status_code"
        ((TESTS_FAILED++))
        echo "Response: $response"
    fi
    echo "----------------------------------------"
}

echo -e "${YELLOW}🚀 Starting Comprehensive API Test Suite${NC}"
echo "Base URL: $BASE_URL"
echo "========================================"

# 1. HEALTH CHECK ENDPOINTS
echo -e "\n${YELLOW}📊 Health Check Endpoints${NC}"

run_test "Health Check" \
    "curl -s '$BASE_URL/api/v1/health'" \
    "200"

run_test "Detailed Health Check" \
    "curl -s '$BASE_URL/api/v1/health/detailed'" \
    "200"

# 2. CRYPTO PRICE ENDPOINTS
echo -e "\n${YELLOW}💰 Crypto Price Endpoints${NC}"

run_test "Get Bitcoin Price (No Auth)" \
    "curl -s '$BASE_URL/api/v1/crypto/prices?ids=bitcoin'" \
    "200"

run_test "Get Multiple Crypto Prices (Free Tier)" \
    "curl -s -H 'X-API-Key: $FREE_KEY' '$BASE_URL/api/v1/crypto/prices?ids=bitcoin,ethereum,cardano&vs_currencies=usd,eur'" \
    "200"

run_test "Get Crypto Prices with Pro Tier" \
    "curl -s -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/crypto/prices?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'" \
    "200"

run_test "Get Single Crypto Info" \
    "curl -s -H 'X-API-Key: $BASIC_KEY' '$BASE_URL/api/v1/crypto/bitcoin'" \
    "200"

run_test "Search Cryptocurrencies" \
    "curl -s -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/crypto/search?query=bitcoin'" \
    "200"

run_test "Get Market Data" \
    "curl -s -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/crypto/markets?vs_currency=usd&order=market_cap_desc&per_page=10'" \
    "200"

# 3. FOREX ENDPOINTS
echo -e "\n${YELLOW}💱 Forex Endpoints${NC}"

run_test "Get USD to EUR Rate" \
    "curl -s '$BASE_URL/api/v1/forex/rates?from=USD&to=EUR'" \
    "200"

run_test "Get Multiple Forex Rates (Pro Tier)" \
    "curl -s -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/forex/rates?from=USD&to=EUR,GBP,JPY'" \
    "200"

run_test "Convert Currency" \
    "curl -s -H 'X-API-Key: $BASIC_KEY' '$BASE_URL/api/v1/forex/convert?from=USD&to=EUR&amount=100'" \
    "200"

# 4. PORTFOLIO ENDPOINTS (Authentication Required)
echo -e "\n${YELLOW}📈 Portfolio Endpoints${NC}"

# Test with Free Tier (Should be blocked)
run_test "Portfolio Calculate (Free Tier - Should Fail)" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $FREE_KEY' '$BASE_URL/api/v1/portfolio/calculate' -d '{\"holdings\": [{\"id\": \"bitcoin\", \"amount\": 1}], \"base_currency\": \"usd\"}'" \
    "403"

# Test with Basic Tier
run_test "Portfolio Value (Basic Tier)" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $BASIC_KEY' '$BASE_URL/api/v1/portfolio/value' -d '{\"holdings\": [{\"id\": \"bitcoin\", \"amount\": 0.5}, {\"id\": \"ethereum\", \"amount\": 5}], \"base_currency\": \"usd\"}'" \
    "200"

# Test with Pro Tier
run_test "Portfolio Calculate (Pro Tier)" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/portfolio/calculate' -d '{\"holdings\": [{\"id\": \"bitcoin\", \"amount\": 1.5, \"cost_basis\": 45000}, {\"id\": \"ethereum\", \"amount\": 10, \"cost_basis\": 2500}], \"base_currency\": \"usd\"}'" \
    "200"

run_test "Portfolio Allocation (Pro Tier)" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/portfolio/allocation' -d '{\"holdings\": [{\"id\": \"bitcoin\", \"amount\": 1}, {\"id\": \"ethereum\", \"amount\": 10}, {\"id\": \"cardano\", \"amount\": 1000}], \"base_currency\": \"usd\"}'" \
    "200"

run_test "Portfolio Performance (Ultra Tier)" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $ULTRA_KEY' '$BASE_URL/api/v1/portfolio/performance' -d '{\"holdings\": [{\"id\": \"bitcoin\", \"amount\": 2, \"cost_basis\": 50000}, {\"id\": \"ethereum\", \"amount\": 15, \"cost_basis\": 3000}], \"base_currency\": \"usd\"}'" \
    "200"

# 5. AUTHENTICATION TESTS
echo -e "\n${YELLOW}🔐 Authentication Tests${NC}"

run_test "No API Key (Public Endpoint)" \
    "curl -s '$BASE_URL/api/v1/crypto/prices?ids=bitcoin'" \
    "200"

run_test "Invalid API Key" \
    "curl -s -H 'X-API-Key: invalid_key' '$BASE_URL/api/v1/crypto/bitcoin'" \
    "401"

run_test "Bearer Token Auth (Pro)" \
    "curl -s -H 'Authorization: Bearer $PRO_KEY' '$BASE_URL/api/v1/crypto/bitcoin'" \
    "200"

run_test "Query Parameter Auth (Basic)" \
    "curl -s '$BASE_URL/api/v1/crypto/bitcoin?api_key=$BASIC_KEY'" \
    "200"

# 6. RATE LIMITING TESTS
echo -e "\n${YELLOW}⏱️ Rate Limiting Tests${NC}"

run_test "Check Rate Limit Headers (Basic Tier)" \
    "curl -s -I -H 'X-API-Key: $BASIC_KEY' '$BASE_URL/api/v1/crypto/prices?ids=bitcoin'" \
    "200"

# Make multiple requests to test burst limiting
echo -e "${BLUE}Testing burst rate limiting...${NC}"
for i in {1..5}; do
    response=$(curl -s -H "X-API-Key: $FREE_KEY" "$BASE_URL/api/v1/crypto/prices?ids=bitcoin" -w "%{http_code}")
    echo "Request $i: HTTP $response"
done

# 7. ERROR HANDLING TESTS
echo -e "\n${YELLOW}❌ Error Handling Tests${NC}"

run_test "Invalid Crypto ID" \
    "curl -s '$BASE_URL/api/v1/crypto/invalid_coin'" \
    "404"

run_test "Invalid Portfolio Data" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/portfolio/calculate' -d '{\"invalid\": \"data\"}'" \
    "400"

run_test "Invalid Forex Pair" \
    "curl -s '$BASE_URL/api/v1/forex/rates?from=INVALID&to=USD'" \
    "400"

# 8. FEATURE ACCESS TESTS
echo -e "\n${YELLOW}🎯 Feature Access Tests${NC}"

# Test historical data access (Pro+ feature)
run_test "Historical Data (Free Tier - Should Fail)" \
    "curl -s -H 'X-API-Key: $FREE_KEY' '$BASE_URL/api/v1/crypto/bitcoin/history?days=30'" \
    "403"

run_test "Historical Data (Pro Tier)" \
    "curl -s -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/crypto/bitcoin/history?days=7'" \
    "200"

# 9. DOCUMENTATION ENDPOINTS
echo -e "\n${YELLOW}📚 Documentation Endpoints${NC}"

run_test "API Documentation" \
    "curl -s '$BASE_URL/docs'" \
    "200"

run_test "OpenAPI Spec" \
    "curl -s '$BASE_URL/docs/json'" \
    "200"

# 10. EDGE CASES AND STRESS TESTS
echo -e "\n${YELLOW}🔥 Edge Cases${NC}"

run_test "Empty Query Parameters" \
    "curl -s '$BASE_URL/api/v1/crypto/prices'" \
    "400"

run_test "Large Amount in Portfolio" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/portfolio/value' -d '{\"holdings\": [{\"id\": \"bitcoin\", \"amount\": 999999}], \"base_currency\": \"usd\"}'" \
    "200"

run_test "Special Characters in Search" \
    "curl -s -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/crypto/search?query=%24%26%23'" \
    "200"

# SUMMARY
echo -e "\n${YELLOW}📊 Test Summary${NC}"
echo "========================================"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! API is working correctly.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please check the API.${NC}"
    exit 1
fi