#!/bin/bash

# Deployment script for Gemini Edge Function
# This script deploys the generate-gemini function to Supabase

set -e

echo "🚀 Deploying Gemini Edge Function to Supabase..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}Warning: Not logged in to Supabase${NC}"
    echo "Login with: supabase login"
    exit 1
fi

# Check required secrets
echo "📋 Checking required secrets..."
REQUIRED_SECRETS=(
    "GOOGLE_AI_API_KEY"
    "OPENAI_API_KEY"
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
)

MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    # Note: We can't actually check secret values, just remind the user
    echo "  - $secret"
done

echo ""
echo -e "${YELLOW}⚠️  Make sure all required secrets are set:${NC}"
echo "  supabase secrets set GOOGLE_AI_API_KEY=AIza..."
echo "  supabase secrets set OPENAI_API_KEY=sk-..."
echo ""
read -p "Have you set all required secrets? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 1
fi

# Deploy the function
echo ""
echo "📦 Deploying function..."
supabase functions deploy generate-gemini

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Test the function:"
    echo "   supabase functions invoke generate-gemini --body '{\"projectId\":\"test\",\"section\":\"introducao\",\"charLimit\":2000}'"
    echo ""
    echo "2. Monitor logs:"
    echo "   supabase functions logs generate-gemini --follow"
    echo ""
    echo "3. Update frontend to use Gemini (see INTEGRATION.md)"
    echo ""
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check the error message above for details"
    exit 1
fi
