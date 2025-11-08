#!/bin/bash

# Test script for Gemini Edge Function
# Tests the function locally and remotely

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Gemini Edge Function${NC}"
echo ""

# Function to test the edge function
test_function() {
    local environment=$1
    local project_id=$2
    local section=$3

    echo -e "${YELLOW}Testing ${environment}...${NC}"

    local body="{
        \"projectId\": \"${project_id}\",
        \"section\": \"${section}\",
        \"charLimit\": 500,
        \"model\": \"gemini-2.0-flash-exp\"
    }"

    if [ "$environment" == "local" ]; then
        # Test locally
        response=$(supabase functions serve generate-gemini &
        sleep 3
        curl -s -X POST http://localhost:54321/functions/v1/generate-gemini \
            -H "Content-Type: application/json" \
            -d "$body"
        )
    else
        # Test remotely
        response=$(supabase functions invoke generate-gemini --body "$body")
    fi

    echo "$response"

    # Check if response contains success: true
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Test passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Test failed${NC}"
        return 1
    fi
}

# Menu
echo "Select test type:"
echo "1. Test locally (requires local Supabase)"
echo "2. Test remote (requires deployed function)"
echo "3. Test both"
echo "4. Load test (multiple requests)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        read -p "Enter project ID: " project_id
        read -p "Enter section key (e.g., introducao): " section
        test_function "local" "$project_id" "$section"
        ;;
    2)
        echo ""
        read -p "Enter project ID: " project_id
        read -p "Enter section key (e.g., introducao): " section
        test_function "remote" "$project_id" "$section"
        ;;
    3)
        echo ""
        read -p "Enter project ID: " project_id
        read -p "Enter section key (e.g., introducao): " section
        echo ""
        test_function "local" "$project_id" "$section"
        echo ""
        test_function "remote" "$project_id" "$section"
        ;;
    4)
        echo ""
        read -p "Enter project ID: " project_id
        read -p "Enter section key: " section
        read -p "Number of requests: " num_requests

        echo ""
        echo "Running $num_requests requests..."

        success=0
        failed=0
        total_time=0

        for i in $(seq 1 $num_requests); do
            start=$(date +%s%N)

            if test_function "remote" "$project_id" "$section" > /dev/null 2>&1; then
                ((success++))
            else
                ((failed++))
            fi

            end=$(date +%s%N)
            duration=$(( (end - start) / 1000000 ))
            total_time=$((total_time + duration))

            echo -e "Request $i/$num_requests - ${duration}ms"
        done

        avg_time=$((total_time / num_requests))

        echo ""
        echo "Results:"
        echo -e "${GREEN}Success: $success${NC}"
        echo -e "${RED}Failed: $failed${NC}"
        echo "Average time: ${avg_time}ms"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}Testing complete!${NC}"
