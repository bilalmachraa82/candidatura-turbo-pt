#!/bin/bash

################################################################################
# Cloudflare Pages Deployment Script
#
# This script automates the deployment of the PT2030 Candidaturas app to
# Cloudflare Pages with all necessary checks and validations.
#
# Usage:
#   ./scripts/deploy-cloudflare.sh [environment]
#
# Arguments:
#   environment: production (default) or preview
#
# Prerequisites:
#   - Node.js 18+ installed
#   - Wrangler CLI installed (npm install -g wrangler)
#   - Cloudflare account with Pages enabled
#   - Authenticated with Wrangler (wrangler login)
################################################################################

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="pt2030-candidaturas"
ENVIRONMENT="${1:-production}"
BUILD_DIR="dist"
START_TIME=$(date +%s)

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

################################################################################
# Pre-deployment Checks
################################################################################

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    log_success "Node.js $(node -v) detected"

    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed."
        exit 1
    fi
    log_success "npm $(npm -v) detected"

    # Check Wrangler CLI
    if ! command -v wrangler &> /dev/null; then
        log_warning "Wrangler CLI is not installed."
        log_info "Installing Wrangler CLI globally..."
        npm install -g wrangler
    fi
    log_success "Wrangler CLI $(wrangler --version) detected"

    # Check Wrangler authentication
    if ! wrangler whoami &> /dev/null; then
        log_error "Not authenticated with Cloudflare."
        log_info "Please run: wrangler login"
        exit 1
    fi
    log_success "Authenticated with Cloudflare as: $(wrangler whoami 2>&1 | grep -oP '(?<=as ).*(?=!)')"
}

check_environment_variables() {
    print_header "Checking Environment Variables"

    REQUIRED_VARS=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
    )

    MISSING_VARS=()

    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        else
            log_success "$var is set"
        fi
    done

    # Check optional but recommended variables
    OPTIONAL_VARS=(
        "VITE_OPENROUTER_API_KEY"
        "VITE_SENTRY_DSN"
        "VITE_POSTHOG_KEY"
    )

    for var in "${OPTIONAL_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            log_warning "$var is not set (optional)"
        else
            log_success "$var is set"
        fi
    done

    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        log_error "Missing required environment variables: ${MISSING_VARS[*]}"
        log_info "Please set these variables in Cloudflare Pages settings:"
        log_info "  https://dash.cloudflare.com/pages/view/$PROJECT_NAME/settings/environment-variables"
        exit 1
    fi
}

################################################################################
# Build Process
################################################################################

build_project() {
    print_header "Building Project"

    log_info "Installing dependencies..."
    npm ci

    log_info "Running production build..."
    npm run build

    if [ ! -d "$BUILD_DIR" ]; then
        log_error "Build directory '$BUILD_DIR' does not exist. Build may have failed."
        exit 1
    fi

    BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
    log_success "Build completed successfully (Size: $BUILD_SIZE)"

    # Count files in build directory
    FILE_COUNT=$(find "$BUILD_DIR" -type f | wc -l)
    log_info "Generated $FILE_COUNT files"
}

################################################################################
# Deployment
################################################################################

deploy_to_cloudflare() {
    print_header "Deploying to Cloudflare Pages"

    log_info "Environment: $ENVIRONMENT"
    log_info "Project: $PROJECT_NAME"

    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Deploying to production branch..."
        wrangler pages deploy "$BUILD_DIR" --project-name="$PROJECT_NAME" --branch=main
    else
        BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
        log_info "Deploying preview for branch: $BRANCH_NAME"
        wrangler pages deploy "$BUILD_DIR" --project-name="$PROJECT_NAME" --branch="$BRANCH_NAME"
    fi

    log_success "Deployment completed successfully!"
}

################################################################################
# Post-deployment
################################################################################

test_deployment() {
    print_header "Testing Deployment"

    # Get deployment URL from Cloudflare
    if [ "$ENVIRONMENT" = "production" ]; then
        DEPLOY_URL="https://$PROJECT_NAME.pages.dev"
    else
        # For preview, construct URL based on branch
        BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD | sed 's/[^a-zA-Z0-9-]/-/g')
        DEPLOY_URL="https://$BRANCH_NAME.$PROJECT_NAME.pages.dev"
    fi

    log_info "Testing deployment at: $DEPLOY_URL"

    # Wait a moment for deployment to propagate
    sleep 5

    # Test HTTP status
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL" || echo "000")

    if [ "$HTTP_STATUS" = "200" ]; then
        log_success "Deployment is live and responding with HTTP $HTTP_STATUS"
    else
        log_warning "Deployment returned HTTP $HTTP_STATUS"
        log_info "It may take a few minutes for the deployment to fully propagate."
    fi

    # Test latency from current location
    log_info "Testing latency..."
    LATENCY=$(curl -s -o /dev/null -w "%{time_total}" "$DEPLOY_URL" || echo "0")
    LATENCY_MS=$(echo "$LATENCY * 1000" | bc)
    log_info "Response time: ${LATENCY_MS}ms"
}

print_summary() {
    print_header "Deployment Summary"

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    if [ "$ENVIRONMENT" = "production" ]; then
        DEPLOY_URL="https://$PROJECT_NAME.pages.dev"
    else
        BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD | sed 's/[^a-zA-Z0-9-]/-/g')
        DEPLOY_URL="https://$BRANCH_NAME.$PROJECT_NAME.pages.dev"
    fi

    echo "✓ Deployment completed in ${DURATION}s"
    echo ""
    echo "📦 Build Size: $BUILD_SIZE"
    echo "🌐 Deployment URL: $DEPLOY_URL"
    echo "🔧 Environment: $ENVIRONMENT"
    echo "📊 Dashboard: https://dash.cloudflare.com/pages/view/$PROJECT_NAME"
    echo ""
    echo "Next steps:"
    echo "1. Visit $DEPLOY_URL to verify the deployment"
    echo "2. Check the Cloudflare Pages dashboard for analytics"
    echo "3. Set up custom domain (if not already configured)"
    echo "4. Configure environment variables in Cloudflare Pages settings"
    echo ""
    log_success "Deployment successful! 🚀"
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header "PT2030 Candidaturas - Cloudflare Pages Deployment"

    check_prerequisites
    check_environment_variables
    build_project
    deploy_to_cloudflare
    test_deployment
    print_summary
}

# Run main function
main
