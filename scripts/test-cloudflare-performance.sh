#!/bin/bash

################################################################################
# Cloudflare Pages Performance Testing Script
#
# This script tests the performance of your Cloudflare Pages deployment
# and compares it with your current Railway deployment (if provided).
#
# Usage:
#   ./scripts/test-cloudflare-performance.sh [cloudflare-url] [railway-url]
#
# Arguments:
#   cloudflare-url: URL of Cloudflare Pages deployment (default: auto-detect)
#   railway-url: URL of Railway deployment for comparison (optional)
#
# Features:
#   - Response time testing
#   - Multiple location testing (using external services)
#   - Performance metrics (TTFB, total time, etc.)
#   - Comparison with Railway (if provided)
#   - HTML report generation
#
# Requirements:
#   - curl
#   - bc (for calculations)
#   - jq (optional, for JSON parsing)
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="pt2030-candidaturas"
DEFAULT_CF_URL="https://${PROJECT_NAME}.pages.dev"
CLOUDFLARE_URL="${1:-$DEFAULT_CF_URL}"
RAILWAY_URL="${2:-}"
NUM_TESTS=10
REPORT_FILE="performance-report-$(date +%Y%m%d-%H%M%S).txt"

################################################################################
# Helper Functions
################################################################################

log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo "========================================================================"
    echo "$1"
    echo "========================================================================"
    echo ""
}

print_subheader() {
    echo ""
    echo "--------------------------------------------------------------------"
    echo "$1"
    echo "--------------------------------------------------------------------"
}

################################################################################
# Prerequisite Checks
################################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check curl
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed. Please install curl."
        exit 1
    fi
    log_success "curl is available"

    # Check bc
    if ! command -v bc &> /dev/null; then
        log_error "bc is not installed. Please install bc for calculations."
        exit 1
    fi
    log_success "bc is available"

    # Check jq (optional)
    if command -v jq &> /dev/null; then
        log_success "jq is available (optional)"
        HAS_JQ=true
    else
        log_warning "jq is not installed (optional, for enhanced reporting)"
        HAS_JQ=false
    fi
}

################################################################################
# Single URL Performance Test
################################################################################

test_url_performance() {
    local URL="$1"
    local LABEL="$2"

    print_subheader "Testing: $LABEL"
    log_info "URL: $URL"

    # Test HTTP status first
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL" || echo "000")

    if [ "$HTTP_STATUS" != "200" ]; then
        log_error "HTTP status: $HTTP_STATUS (expected 200)"
        return 1
    fi
    log_success "HTTP status: 200"

    # Initialize arrays for metrics
    declare -a dns_times
    declare -a connect_times
    declare -a ttfb_times
    declare -a total_times

    # Run multiple tests
    log_info "Running $NUM_TESTS performance tests..."

    for i in $(seq 1 $NUM_TESTS); do
        # Capture timing metrics
        TIMING=$(curl -w "@-" -o /dev/null -s "$URL" <<'EOF'
%{time_namelookup},%{time_connect},%{time_starttransfer},%{time_total}
EOF
)
        # Parse timings
        DNS=$(echo "$TIMING" | cut -d',' -f1)
        CONNECT=$(echo "$TIMING" | cut -d',' -f2)
        TTFB=$(echo "$TIMING" | cut -d',' -f3)
        TOTAL=$(echo "$TIMING" | cut -d',' -f4)

        dns_times+=("$DNS")
        connect_times+=("$CONNECT")
        ttfb_times+=("$TTFB")
        total_times+=("$TOTAL")

        # Progress indicator
        echo -n "."
    done
    echo ""

    # Calculate statistics
    log_info "Calculating statistics..."

    # Function to calculate average
    calc_avg() {
        local sum=0
        local count=0
        for value in "$@"; do
            sum=$(echo "$sum + $value" | bc)
            count=$((count + 1))
        done
        echo "scale=3; $sum / $count" | bc
    }

    # Function to calculate min
    calc_min() {
        local min=${1}
        for value in "$@"; do
            if (( $(echo "$value < $min" | bc -l) )); then
                min=$value
            fi
        done
        echo "$min"
    }

    # Function to calculate max
    calc_max() {
        local max=${1}
        for value in "$@"; do
            if (( $(echo "$value > $max" | bc -l) )); then
                max=$value
            fi
        done
        echo "$max"
    }

    # Calculate averages
    AVG_DNS=$(calc_avg "${dns_times[@]}")
    AVG_CONNECT=$(calc_avg "${connect_times[@]}")
    AVG_TTFB=$(calc_avg "${ttfb_times[@]}")
    AVG_TOTAL=$(calc_avg "${total_times[@]}")

    # Calculate min/max
    MIN_TOTAL=$(calc_min "${total_times[@]}")
    MAX_TOTAL=$(calc_max "${total_times[@]}")

    # Convert to milliseconds for display
    AVG_DNS_MS=$(echo "$AVG_DNS * 1000" | bc)
    AVG_CONNECT_MS=$(echo "$AVG_CONNECT * 1000" | bc)
    AVG_TTFB_MS=$(echo "$AVG_TTFB * 1000" | bc)
    AVG_TOTAL_MS=$(echo "$AVG_TOTAL * 1000" | bc)
    MIN_TOTAL_MS=$(echo "$MIN_TOTAL * 1000" | bc)
    MAX_TOTAL_MS=$(echo "$MAX_TOTAL * 1000" | bc)

    # Display results
    echo ""
    echo -e "${CYAN}Performance Results:${NC}"
    echo "  DNS Lookup:        ${AVG_DNS_MS} ms"
    echo "  TCP Connect:       ${AVG_CONNECT_MS} ms"
    echo "  Time to First Byte: ${AVG_TTFB_MS} ms"
    echo "  Total Time (avg):  ${AVG_TOTAL_MS} ms"
    echo "  Total Time (min):  ${MIN_TOTAL_MS} ms"
    echo "  Total Time (max):  ${MAX_TOTAL_MS} ms"

    # Export results for comparison
    RESULTS["${LABEL}_AVG_TOTAL"]="$AVG_TOTAL_MS"
    RESULTS["${LABEL}_MIN_TOTAL"]="$MIN_TOTAL_MS"
    RESULTS["${LABEL}_MAX_TOTAL"]="$MAX_TOTAL_MS"
    RESULTS["${LABEL}_AVG_TTFB"]="$AVG_TTFB_MS"

    # Performance rating
    if (( $(echo "$AVG_TOTAL_MS < 100" | bc -l) )); then
        log_success "Performance: Excellent (< 100ms)"
    elif (( $(echo "$AVG_TOTAL_MS < 300" | bc -l) )); then
        log_success "Performance: Good (< 300ms)"
    elif (( $(echo "$AVG_TOTAL_MS < 1000" | bc -l) )); then
        log_warning "Performance: Fair (< 1s)"
    else
        log_warning "Performance: Needs improvement (> 1s)"
    fi

    echo ""
}

################################################################################
# Multi-location Testing (using external API)
################################################################################

test_multiple_locations() {
    print_header "Testing from Multiple Locations"

    local URL="$CLOUDFLARE_URL"

    log_info "Testing Cloudflare edge network distribution..."

    # Test from different locations using curl with different DNS resolvers
    # This is a simplified approach - for production, use services like:
    # - Pingdom
    # - GTmetrix
    # - WebPageTest API

    LOCATIONS=(
        "Cloudflare DNS (1.1.1.1)"
        "Google DNS (8.8.8.8)"
        "Quad9 DNS (9.9.9.9)"
    )

    DNS_SERVERS=(
        "1.1.1.1"
        "8.8.8.8"
        "9.9.9.9"
    )

    for i in "${!LOCATIONS[@]}"; do
        LOCATION="${LOCATIONS[$i]}"
        DNS="${DNS_SERVERS[$i]}"

        log_info "Testing from: $LOCATION"

        # Test with specific DNS resolver
        RESPONSE_TIME=$(curl --dns-servers "$DNS" -o /dev/null -s -w '%{time_total}' "$URL" 2>/dev/null || echo "0")

        if [ "$RESPONSE_TIME" != "0" ]; then
            RESPONSE_MS=$(echo "$RESPONSE_TIME * 1000" | bc)
            echo "  Response time: ${RESPONSE_MS} ms"
        else
            log_warning "  Could not test from this location"
        fi
    done

    echo ""
    log_info "For comprehensive multi-location testing, use:"
    log_info "  - WebPageTest: https://www.webpagetest.org/"
    log_info "  - Pingdom: https://tools.pingdom.com/"
    log_info "  - GTmetrix: https://gtmetrix.com/"
}

################################################################################
# Asset Loading Test
################################################################################

test_asset_loading() {
    print_header "Testing Asset Loading"

    local URL="$CLOUDFLARE_URL"

    log_info "Fetching HTML and analyzing assets..."

    # Fetch HTML
    HTML=$(curl -s "$URL")

    # Count different asset types
    JS_COUNT=$(echo "$HTML" | grep -o '<script[^>]*src=' | wc -l)
    CSS_COUNT=$(echo "$HTML" | grep -o '<link[^>]*rel="stylesheet"' | wc -l)
    IMG_COUNT=$(echo "$HTML" | grep -o '<img[^>]*src=' | wc -l)

    echo "  JavaScript files: $JS_COUNT"
    echo "  CSS files: $CSS_COUNT"
    echo "  Images: $IMG_COUNT"

    # Test a sample asset (first JS file)
    log_info "Testing JavaScript asset loading..."

    FIRST_JS=$(echo "$HTML" | grep -o '<script[^>]*src="[^"]*"' | head -1 | sed 's/.*src="\([^"]*\)".*/\1/')

    if [ -n "$FIRST_JS" ]; then
        # Handle relative URLs
        if [[ "$FIRST_JS" == /* ]]; then
            ASSET_URL="${URL}${FIRST_JS}"
        elif [[ "$FIRST_JS" == http* ]]; then
            ASSET_URL="$FIRST_JS"
        else
            ASSET_URL="${URL}/${FIRST_JS}"
        fi

        ASSET_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$ASSET_URL")
        ASSET_MS=$(echo "$ASSET_TIME * 1000" | bc)
        echo "  Sample JS load time: ${ASSET_MS} ms"

        # Check caching headers
        CACHE_HEADER=$(curl -s -I "$ASSET_URL" | grep -i "cache-control" || echo "none")
        echo "  Cache-Control: $CACHE_HEADER"
    fi

    echo ""
}

################################################################################
# Security Headers Test
################################################################################

test_security_headers() {
    print_header "Testing Security Headers"

    local URL="$CLOUDFLARE_URL"

    log_info "Checking security headers..."

    # Fetch headers
    HEADERS=$(curl -s -I "$URL")

    # Check for important security headers
    SECURITY_HEADERS=(
        "X-Frame-Options"
        "X-Content-Type-Options"
        "X-XSS-Protection"
        "Strict-Transport-Security"
        "Content-Security-Policy"
        "Referrer-Policy"
    )

    for HEADER in "${SECURITY_HEADERS[@]}"; do
        if echo "$HEADERS" | grep -qi "$HEADER"; then
            VALUE=$(echo "$HEADERS" | grep -i "$HEADER" | cut -d':' -f2- | xargs)
            log_success "$HEADER: $VALUE"
        else
            log_warning "$HEADER: Not set"
        fi
    done

    echo ""
}

################################################################################
# Comparison Report
################################################################################

generate_comparison() {
    if [ -z "$RAILWAY_URL" ]; then
        return
    fi

    print_header "Performance Comparison"

    # Get metrics
    CF_AVG="${RESULTS[Cloudflare_AVG_TOTAL]}"
    RW_AVG="${RESULTS[Railway_AVG_TOTAL]}"

    # Calculate improvement
    if [ -n "$CF_AVG" ] && [ -n "$RW_AVG" ]; then
        IMPROVEMENT=$(echo "scale=1; ($RW_AVG - $CF_AVG) / $RW_AVG * 100" | bc)
        SPEEDUP=$(echo "scale=2; $RW_AVG / $CF_AVG" | bc)

        echo -e "${CYAN}Comparison Results:${NC}"
        echo "  Railway (avg):     ${RW_AVG} ms"
        echo "  Cloudflare (avg):  ${CF_AVG} ms"
        echo ""
        echo -e "${GREEN}Improvement:        ${IMPROVEMENT}% faster${NC}"
        echo -e "${GREEN}Speedup:            ${SPEEDUP}x${NC}"

        if (( $(echo "$IMPROVEMENT > 50" | bc -l) )); then
            log_success "Cloudflare Pages is significantly faster!"
        elif (( $(echo "$IMPROVEMENT > 0" | bc -l) )); then
            log_success "Cloudflare Pages is faster"
        else
            log_warning "Railway appears to be faster in this test"
        fi
    fi

    echo ""
}

################################################################################
# Generate Report
################################################################################

generate_report() {
    print_header "Generating Report"

    {
        echo "========================================================================"
        echo "Cloudflare Pages Performance Test Report"
        echo "========================================================================"
        echo ""
        echo "Date: $(date)"
        echo "Cloudflare URL: $CLOUDFLARE_URL"
        if [ -n "$RAILWAY_URL" ]; then
            echo "Railway URL: $RAILWAY_URL"
        fi
        echo "Number of tests: $NUM_TESTS"
        echo ""

        echo "--------------------------------------------------------------------"
        echo "Cloudflare Pages Results"
        echo "--------------------------------------------------------------------"
        echo "Average Total Time: ${RESULTS[Cloudflare_AVG_TOTAL]} ms"
        echo "Min Total Time: ${RESULTS[Cloudflare_MIN_TOTAL]} ms"
        echo "Max Total Time: ${RESULTS[Cloudflare_MAX_TOTAL]} ms"
        echo "Average TTFB: ${RESULTS[Cloudflare_AVG_TTFB]} ms"
        echo ""

        if [ -n "$RAILWAY_URL" ]; then
            echo "--------------------------------------------------------------------"
            echo "Railway Results"
            echo "--------------------------------------------------------------------"
            echo "Average Total Time: ${RESULTS[Railway_AVG_TOTAL]} ms"
            echo "Min Total Time: ${RESULTS[Railway_MIN_TOTAL]} ms"
            echo "Max Total Time: ${RESULTS[Railway_MAX_TOTAL]} ms"
            echo "Average TTFB: ${RESULTS[Railway_AVG_TTFB]} ms"
            echo ""

            echo "--------------------------------------------------------------------"
            echo "Comparison"
            echo "--------------------------------------------------------------------"
            CF_AVG="${RESULTS[Cloudflare_AVG_TOTAL]}"
            RW_AVG="${RESULTS[Railway_AVG_TOTAL]}"
            IMPROVEMENT=$(echo "scale=1; ($RW_AVG - $CF_AVG) / $RW_AVG * 100" | bc)
            SPEEDUP=$(echo "scale=2; $RW_AVG / $CF_AVG" | bc)
            echo "Improvement: ${IMPROVEMENT}%"
            echo "Speedup: ${SPEEDUP}x"
            echo ""
        fi

        echo "--------------------------------------------------------------------"
        echo "Test Configuration"
        echo "--------------------------------------------------------------------"
        echo "Location: $(curl -s ifconfig.me/city 2>/dev/null || echo 'Unknown')"
        echo "ISP: $(curl -s ifconfig.me/host 2>/dev/null || echo 'Unknown')"
        echo ""

        echo "========================================================================"
    } > "$REPORT_FILE"

    log_success "Report saved to: $REPORT_FILE"
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header "Cloudflare Pages Performance Testing"

    # Initialize results dictionary
    declare -gA RESULTS

    check_prerequisites

    # Test Cloudflare Pages
    test_url_performance "$CLOUDFLARE_URL" "Cloudflare"

    # Test Railway (if URL provided)
    if [ -n "$RAILWAY_URL" ]; then
        test_url_performance "$RAILWAY_URL" "Railway"
        generate_comparison
    fi

    # Additional tests
    test_multiple_locations
    test_asset_loading
    test_security_headers

    # Generate report
    generate_report

    print_header "Testing Complete"

    log_success "All tests completed successfully!"
    log_info "Review the full report: $REPORT_FILE"
    echo ""
}

# Run main function
main
