#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Claude SDK Edge Function - Test Suite${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Configuration
PROJECT_ID="${TEST_PROJECT_ID:-test-project}"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Helper function to run test
run_test() {
    local test_name="$1"
    local test_body="$2"
    local expect_success="${3:-true}"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}Test $TOTAL_TESTS: $test_name${NC}"
    echo -e "${BLUE}Request:${NC}"
    echo "$test_body" | jq '.' 2>/dev/null || echo "$test_body"

    # Run the test
    local response=$(supabase functions invoke generate-claude --body "$test_body" 2>&1)
    local exit_code=$?

    echo -e "${BLUE}Response:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"

    # Check result
    if [ $exit_code -eq 0 ] && echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
        if [ "$expect_success" = "true" ]; then
            echo -e "${GREEN}✅ PASS${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ FAIL - Expected failure but got success${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    elif [ "$expect_success" = "false" ]; then
        echo -e "${GREEN}✅ PASS - Failed as expected${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    echo ""
    sleep 2 # Rate limiting
}

echo -e "${BLUE}Starting tests...${NC}"
echo ""

# Test 1: Basic generation for innovation section
run_test "Basic Generation - Innovation Section" '{
  "projectId": "'"$PROJECT_ID"'",
  "section": "12.i",
  "charLimit": 1000
}' true

# Test 2: Custom prompt
run_test "Custom Prompt - Project Designation" '{
  "projectId": "'"$PROJECT_ID"'",
  "section": "9.designacao",
  "customPrompt": "Descreva um projeto inovador de transformação digital no setor da saúde",
  "charLimit": 1500
}' true

# Test 3: Small character limit
run_test "Small Character Limit" '{
  "projectId": "'"$PROJECT_ID"'",
  "section": "20.B1",
  "charLimit": 500
}' true

# Test 4: Large character limit
run_test "Large Character Limit" '{
  "projectId": "'"$PROJECT_ID"'",
  "section": "19.fundamentacao",
  "charLimit": 5000
}' true

# Test 5: Missing required field - projectId
run_test "Error Handling - Missing ProjectId" '{
  "section": "12.i",
  "charLimit": 1000
}' false

# Test 6: Missing required field - section
run_test "Error Handling - Missing Section" '{
  "projectId": "'"$PROJECT_ID"'",
  "charLimit": 1000
}' false

# Test 7: Invalid section
run_test "Error Handling - Invalid Section" '{
  "projectId": "'"$PROJECT_ID"'",
  "section": "invalid-section",
  "charLimit": 1000
}' false

# Test 8: Different model (if supported)
run_test "Alternative Model - Claude 3.7 Sonnet" '{
  "projectId": "'"$PROJECT_ID"'",
  "section": "20.C1",
  "charLimit": 1200,
  "model": "claude-3-7-sonnet-20250219"
}' true

# Test 9: Cache performance test (sequential requests)
echo -e "${CYAN}Test Cache Performance (Sequential Requests)${NC}"
echo "Making 3 requests to the same section to test cache..."
echo ""

for i in {1..3}; do
    echo -e "${BLUE}Request $i of 3${NC}"
    run_test "Cache Test Request $i" '{
      "projectId": "'"$PROJECT_ID"'",
      "section": "12.i",
      "charLimit": 1000
    }' true

    # Check for cache metrics in response
    if [ $i -gt 1 ]; then
        echo -e "${YELLOW}Expected cache hit on this request${NC}"
    fi
done

# Summary
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
