#!/bin/bash

# Production API Testing Script
# Usage: ./test_production.sh [BASE_URL]
# Example: ./test_production.sh https://your-api.railway.app

# Default to localhost if no URL provided
BASE_URL=${1:-"http://localhost:3000"}

# API Keys for different tiers
FREE_KEY="demo_free_key"
BASIC_KEY="demo_basic_key"
PRO_KEY="demo_pro_key"
ULTRA_KEY="demo_ultra_key"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Production API Test Suite${NC}"
echo "Testing URL: $BASE_URL"
echo "====================================="

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
    local test_name="$1"
    local command="$2"
    local should_succeed="$3"  # true/false

    echo -e "${BLUE}Testing: $test_name${NC}"

    response=$(eval "$command" 2>/dev/null)

    # Check if response contains "success": true
    if echo "$response" | grep -q '"success":true'; then
        if [ "$should_succeed" = "true" ]; then
            echo -e "${GREEN}✓ PASS${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}✗ FAIL (expected failure but got success)${NC}"
            ((TESTS_FAILED++))
        fi
    else
        if [ "$should_succeed" = "false" ]; then
            echo -e "${GREEN}✓ PASS (expected failure)${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}✗ FAIL${NC}"
            ((TESTS_FAILED++))
        fi
    fi

    # Show condensed response
    if command -v jq >/dev/null 2>&1; then
        echo "$response" | jq -c . 2>/dev/null | head -c 100
        echo "..."
    else
        echo "$response" | head -c 100
        echo "..."
    fi
    echo "----------------------------------------"
    sleep 2  # Rate limiting prevention
}

echo -e "\n${YELLOW}📊 Core Functionality Tests${NC}"

run_test "Health Check" \
    "curl -s '$BASE_URL/api/v1/health'" \
    "true"

run_test "Crypto Prices (Public)" \
    "curl -s '$BASE_URL/api/v1/crypto/prices?ids=bitcoin'" \
    "true"

run_test "Popular Cryptos (Basic Tier)" \
    "curl -s -H 'X-API-Key: $BASIC_KEY' '$BASE_URL/api/v1/crypto/popular'" \
    "true"

echo -e "\n${YELLOW}🔐 Authentication & Authorization Tests${NC}"

run_test "Invalid API Key" \
    "curl -s -H 'X-API-Key: invalid_key' '$BASE_URL/api/v1/crypto/popular'" \
    "false"

run_test "Portfolio Access (Free Tier - Should Fail)" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $FREE_KEY' '$BASE_URL/api/v1/portfolio/value' -d '{\"holdings\":[{\"id\":\"bitcoin\",\"amount\":0.1}],\"base_currency\":\"usd\"}'" \
    "false"

run_test "Portfolio Access (Basic Tier - Should Work)" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $BASIC_KEY' '$BASE_URL/api/v1/portfolio/value' -d '{\"holdings\":[{\"id\":\"bitcoin\",\"amount\":0.1}],\"base_currency\":\"usd\"}'" \
    "true"

echo -e "\n${YELLOW}📈 Portfolio Management Tests${NC}"

run_test "Portfolio Calculate (Pro Tier)" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/portfolio/calculate' -d '{\"holdings\":[{\"id\":\"bitcoin\",\"amount\":1,\"cost_basis\":50000}],\"base_currency\":\"usd\"}'" \
    "true"

run_test "Portfolio Allocation (Pro Tier)" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/portfolio/allocation' -d '{\"holdings\":[{\"id\":\"bitcoin\",\"amount\":1},{\"id\":\"ethereum\",\"amount\":10}],\"base_currency\":\"usd\"}'" \
    "true"

run_test "Portfolio Performance (Ultra Tier)" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $ULTRA_KEY' '$BASE_URL/api/v1/portfolio/performance' -d '{\"holdings\":[{\"id\":\"bitcoin\",\"amount\":2,\"cost_basis\":50000}],\"base_currency\":\"usd\"}'" \
    "true"

echo -e "\n${YELLOW}⏱️ Rate Limiting Tests${NC}"

echo -e "${BLUE}Testing rate limiting headers...${NC}"
headers=$(curl -s -I -H "X-API-Key: $BASIC_KEY" "$BASE_URL/api/v1/crypto/prices?ids=bitcoin" 2>/dev/null)
if echo "$headers" | grep -q "x-ratelimit"; then
    echo -e "${GREEN}✓ Rate limiting headers present${NC}"
    echo "$headers" | grep "x-ratelimit" | head -3
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Rate limiting headers missing${NC}"
    ((TESTS_FAILED++))
fi

echo -e "\n${YELLOW}❌ Error Handling Tests${NC}"

run_test "Invalid Portfolio Data" \
    "curl -s -X POST -H 'Content-Type: application/json' -H 'X-API-Key: $PRO_KEY' '$BASE_URL/api/v1/portfolio/value' -d '{\"invalid\":\"data\"}'" \
    "false"

run_test "Empty Crypto IDs" \
    "curl -s '$BASE_URL/api/v1/crypto/prices'" \
    "false"

echo -e "\n${YELLOW}🌐 Production Environment Tests${NC}"

echo -e "${BLUE}Testing CORS headers...${NC}"
cors_headers=$(curl -s -I -H "Origin: https://example.com" "$BASE_URL/api/v1/health" 2>/dev/null)
if echo "$cors_headers" | grep -q "Access-Control"; then
    echo -e "${GREEN}✓ CORS headers configured${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}? CORS headers not found (may be OK)${NC}"
fi

echo -e "${BLUE}Testing HTTPS (if applicable)...${NC}"
if [[ $BASE_URL == https* ]]; then
    if curl -s -I "$BASE_URL/api/v1/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ HTTPS working${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ HTTPS issues${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${YELLOW}? HTTP endpoint (consider HTTPS for production)${NC}"
fi

# Final Summary
echo -e "\n${YELLOW}📊 Test Results Summary${NC}"
echo "====================================="
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
echo -e "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! API is production ready.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please review before production deployment.${NC}"
    exit 1
fi