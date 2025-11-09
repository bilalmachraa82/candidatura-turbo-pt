#!/bin/bash
set -e

echo "🚀 Deploying Claude SDK Edge Function..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo -e "${BLUE}Checking environment configuration...${NC}"

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Supabase${NC}"
    echo "Run: supabase login"
    exit 1
fi

# Check for required secrets
echo -e "${BLUE}Verifying required secrets...${NC}"

REQUIRED_SECRETS=("ANTHROPIC_API_KEY" "OPENAI_API_KEY" "SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! supabase secrets list | grep -q "$secret"; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing required secrets:${NC}"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo -e "${YELLOW}   - $secret${NC}"
    done
    echo ""
    echo "Set secrets with:"
    echo -e "${BLUE}supabase secrets set ANTHROPIC_API_KEY=sk-ant-...${NC}"
    echo -e "${BLUE}supabase secrets set OPENAI_API_KEY=sk-...${NC}"

    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ All required secrets are configured${NC}"
fi

# Optional: Check Sentry DSN
if ! supabase secrets list | grep -q "SENTRY_DSN"; then
    echo -e "${YELLOW}⚠️  SENTRY_DSN not configured (optional)${NC}"
    echo "   Error tracking will be limited without Sentry"
fi

echo ""
echo -e "${BLUE}Deploying generate-claude function...${NC}"

# Deploy the function
if supabase functions deploy generate-claude --no-verify-jwt; then
    echo ""
    echo -e "${GREEN}✅ Claude SDK deployed successfully!${NC}"
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📊 Function Details:"
echo "   • Name: generate-claude"
echo "   • Provider: Anthropic Claude"
echo "   • Model: claude-3-5-sonnet-20241022"
echo "   • Features: Prompt Caching, RAG Integration"
echo ""
echo "🧪 Test the function:"
echo -e "${BLUE}./test.sh${NC}"
echo ""
echo "Or manually:"
echo -e "${BLUE}supabase functions invoke generate-claude --body '{${NC}"
echo -e '  "projectId": "YOUR_PROJECT_ID",'
echo -e '  "section": "9.designacao",'
echo -e '  "charLimit": 1000'
echo -e "${BLUE}}'${NC}"
echo ""
echo "📚 Documentation:"
echo "   • README.md - Function overview and API reference"
echo "   • PROMPT_CACHING.md - Detailed caching guide"
echo ""
echo "💰 Cost Optimization:"
echo "   • First request: ~\$0.006 (creates cache)"
echo "   • Cached requests: ~\$0.0012 (90% savings on input)"
echo "   • Cache TTL: 5 minutes"
echo ""
echo "📈 Monitor performance:"
echo -e "${BLUE}supabase functions logs generate-claude --tail${NC}"
echo ""
echo -e "${GREEN}Happy generating! 🎉${NC}"
