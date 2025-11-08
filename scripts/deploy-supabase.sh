#!/bin/bash

# 🚀 Supabase Deployment Script - PT2030 Candidaturas
# Deploys database migrations and edge functions

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║      🚀 PT2030 - Supabase Deployment Automation 🚀        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check Supabase CLI installed
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI not found. Install with: npm install -g supabase"
    exit 1
fi

log_success "Supabase CLI found"

# Check if project is linked
if [[ ! -f .git/supabase-project-ref ]]; then
    log_warning "Supabase project not linked yet"
    echo ""
    read -p "Enter your Supabase Project Ref (e.g., abcdefghijklm): " project_ref

    log_info "Linking to Supabase project..."
    supabase link --project-ref "$project_ref"
    log_success "Project linked"
fi

# Get deployment type
echo ""
echo "What do you want to deploy?"
echo "1) 🗄️  Database migrations only"
echo "2) ⚡ Edge functions only"
echo "3) 🔑 Secrets only"
echo "4) 🚀 Everything (migrations + functions + secrets)"
echo ""
read -p "Choose option (1-4): " deploy_option

# ============================================
# PHASE 1: Database Migrations
# ============================================
if [[ $deploy_option == "1" || $deploy_option == "4" ]]; then
    echo ""
    log_info "════════════════════════════════════════════════════════"
    log_info "PHASE 1: Database Migrations"
    log_info "════════════════════════════════════════════════════════"

    # Check if migrations exist
    if [[ ! -d "supabase/migrations" ]]; then
        log_error "Migrations directory not found"
        exit 1
    fi

    # List migrations
    log_info "Found migrations:"
    ls -1 supabase/migrations/*.sql | while read -r migration; do
        echo "  - $(basename "$migration")"
    done

    echo ""
    read -p "Apply all migrations? (y/n): " apply_migrations

    if [[ $apply_migrations == "y" ]]; then
        log_info "Applying migrations..."

        # Apply migrations in order
        MIGRATIONS=(
            "20250108000001_add_claude_cost_tracking.sql"
            "20250121000004_chat_copilot.sql"
            "20250121000004_quality_scoring.sql"
            "20250121000005_rbac_system.sql"
            "20250121000006_version_history.sql"
        )

        for migration in "${MIGRATIONS[@]}"; do
            if [[ -f "supabase/migrations/$migration" ]]; then
                log_info "Applying: $migration"
                supabase db push
                log_success "✓ $migration applied"
            else
                log_warning "Migration not found: $migration (skipping)"
            fi
        done

        log_success "All migrations applied"

        # Verify tables created
        log_info "Verifying database schema..."
        supabase db diff
        log_success "Database schema verified"
    else
        log_warning "Migrations skipped"
    fi
fi

# ============================================
# PHASE 2: Secrets
# ============================================
if [[ $deploy_option == "3" || $deploy_option == "4" ]]; then
    echo ""
    log_info "════════════════════════════════════════════════════════"
    log_info "PHASE 2: Supabase Secrets"
    log_info "════════════════════════════════════════════════════════"

    log_info "Current secrets:"
    supabase secrets list || log_warning "No secrets found"

    echo ""
    read -p "Do you want to configure secrets? (y/n): " configure_secrets

    if [[ $configure_secrets == "y" ]]; then
        echo ""
        log_info "Enter API keys (press Enter to skip):"

        # Google AI API Key
        read -p "Google AI API Key (for Gemini): " google_key
        if [[ -n $google_key ]]; then
            echo "$google_key" | supabase secrets set GOOGLE_AI_API_KEY
            log_success "✓ GOOGLE_AI_API_KEY set"
        fi

        # Anthropic API Key
        read -p "Anthropic API Key (for Claude): " anthropic_key
        if [[ -n $anthropic_key ]]; then
            echo "$anthropic_key" | supabase secrets set ANTHROPIC_API_KEY
            log_success "✓ ANTHROPIC_API_KEY set"
        fi

        # Resend API Key
        read -p "Resend API Key (for emails): " resend_key
        if [[ -n $resend_key ]]; then
            echo "$resend_key" | supabase secrets set RESEND_API_KEY
            log_success "✓ RESEND_API_KEY set"
        fi

        # OpenRouter API Key (optional)
        read -p "OpenRouter API Key (optional fallback): " openrouter_key
        if [[ -n $openrouter_key ]]; then
            echo "$openrouter_key" | supabase secrets set OPENROUTER_API_KEY
            log_success "✓ OPENROUTER_API_KEY set"
        fi

        echo ""
        log_info "Final secrets configuration:"
        supabase secrets list
    else
        log_warning "Secrets configuration skipped"
    fi
fi

# ============================================
# PHASE 3: Edge Functions
# ============================================
if [[ $deploy_option == "2" || $deploy_option == "4" ]]; then
    echo ""
    log_info "════════════════════════════════════════════════════════"
    log_info "PHASE 3: Edge Functions Deployment"
    log_info "════════════════════════════════════════════════════════"

    # List all functions
    FUNCTIONS=()

    # New premium functions
    [[ -d "supabase/functions/generate-claude" ]] && FUNCTIONS+=("generate-claude")
    [[ -d "supabase/functions/chat-copilot" ]] && FUNCTIONS+=("chat-copilot")
    [[ -d "supabase/functions/score-section" ]] && FUNCTIONS+=("score-section")
    [[ -d "supabase/functions/invite-project-member" ]] && FUNCTIONS+=("invite-project-member")

    # Existing functions
    [[ -d "supabase/functions/generate-gemini" ]] && FUNCTIONS+=("generate-gemini")
    [[ -d "supabase/functions/generate-openrouter" ]] && FUNCTIONS+=("generate-openrouter")
    [[ -d "supabase/functions/generate-stream" ]] && FUNCTIONS+=("generate-stream")
    [[ -d "supabase/functions/index-document" ]] && FUNCTIONS+=("index-document")
    [[ -d "supabase/functions/export-document" ]] && FUNCTIONS+=("export-document")
    [[ -d "supabase/functions/send-email" ]] && FUNCTIONS+=("send-email")

    if [[ ${#FUNCTIONS[@]} -eq 0 ]]; then
        log_warning "No edge functions found"
    else
        log_info "Found ${#FUNCTIONS[@]} functions:"
        for func in "${FUNCTIONS[@]}"; do
            echo "  - $func"
        done

        echo ""
        read -p "Deploy all functions? (y/n): " deploy_functions

        if [[ $deploy_functions == "y" ]]; then
            log_info "Deploying edge functions..."

            for func in "${FUNCTIONS[@]}"; do
                log_info "Deploying: $func"

                # Deploy with no-verify-jwt=false for security
                if supabase functions deploy "$func" --no-verify-jwt=false; then
                    log_success "✓ $func deployed"
                else
                    log_error "✗ Failed to deploy $func"
                fi
            done

            log_success "Edge functions deployment complete"

            # List deployed functions
            echo ""
            log_info "Deployed functions:"
            supabase functions list
        else
            log_warning "Edge functions deployment skipped"
        fi
    fi
fi

# ============================================
# PHASE 4: Verification
# ============================================
echo ""
log_info "════════════════════════════════════════════════════════"
log_info "PHASE 4: Deployment Verification"
log_info "════════════════════════════════════════════════════════"

# Get project details
PROJECT_REF=$(cat .git/supabase-project-ref 2>/dev/null || echo "unknown")
log_info "Project Ref: $PROJECT_REF"

# Test database connection
log_info "Testing database connection..."
if supabase db ping &> /dev/null; then
    log_success "✓ Database online"
else
    log_error "✗ Database offline"
fi

# List edge functions
log_info "Edge functions URLs:"
log_info "  https://$PROJECT_REF.supabase.co/functions/v1/"
echo ""

# ============================================
# SUMMARY
# ============================================
echo ""
log_success "════════════════════════════════════════════════════════"
log_success "✅ DEPLOYMENT COMPLETE!"
log_success "════════════════════════════════════════════════════════"
echo ""

echo "📚 Next Steps:"
echo ""
echo "1. Test Edge Functions:"
echo "   - Open Supabase Dashboard → Edge Functions"
echo "   - Test each function with sample data"
echo ""
echo "2. Verify Database:"
echo "   - Open Supabase Dashboard → Database"
echo "   - Check new tables: chat_conversations, quality_scores, etc."
echo ""
echo "3. Configure Frontend:"
echo "   - Update .env with Supabase URL and keys"
echo "   - Run: npm run dev"
echo "   - Test all premium features"
echo ""
echo "4. Monitor Logs:"
echo "   - supabase functions logs <function-name> --tail"
echo ""

log_info "Happy deploying! 🚀"
echo ""
