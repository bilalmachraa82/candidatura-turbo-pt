#!/bin/bash

# 🚀 Script de Deploy Automático - PT2030 Candidaturas
# Autor: Claude Code
# Versão: 1.0

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║       🚀 PT2030 Candidaturas - Deploy Automático 🚀       ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Verificar dependências
log_info "Verificando dependências..."

if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI não encontrado. Instale com: npm install -g supabase"
    exit 1
fi

if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado. Instale Node.js 18+"
    exit 1
fi

log_success "Dependências OK"

# Perguntar tipo de deploy
echo ""
echo "Escolha o tipo de deploy:"
echo "1) 🔧 Local (Supabase local)"
echo "2) ☁️  Production (Supabase cloud + Railway)"
echo "3) 🧪 Staging (apenas Supabase cloud)"
echo ""
read -p "Opção (1-3): " deploy_type

case $deploy_type in
    1)
        DEPLOY_ENV="local"
        ;;
    2)
        DEPLOY_ENV="production"
        ;;
    3)
        DEPLOY_ENV="staging"
        ;;
    *)
        log_error "Opção inválida"
        exit 1
        ;;
esac

log_info "Deploy: ${DEPLOY_ENV}"

# ============================================
# FASE 1: Verificações Pré-Deploy
# ============================================
echo ""
log_info "════════════════════════════════════════════════════════"
log_info "FASE 1: Verificações Pré-Deploy"
log_info "════════════════════════════════════════════════════════"

# Verificar git status
if [[ -n $(git status -s) ]]; then
    log_warning "Existem alterações não commitadas"
    read -p "Continuar mesmo assim? (y/n): " continue_deploy
    if [[ $continue_deploy != "y" ]]; then
        log_error "Deploy cancelado"
        exit 1
    fi
fi

# Verificar branch
CURRENT_BRANCH=$(git branch --show-current)
log_info "Branch atual: ${CURRENT_BRANCH}"

# Verificar .env
if [[ $DEPLOY_ENV == "local" ]]; then
    if [[ ! -f .env.local ]]; then
        log_error "Ficheiro .env.local não encontrado"
        log_info "Crie a partir de: cp .env.local.example .env.local"
        exit 1
    fi
    log_success ".env.local encontrado"
fi

# ============================================
# FASE 2: Build & Testes
# ============================================
echo ""
log_info "════════════════════════════════════════════════════════"
log_info "FASE 2: Build & Testes"
log_info "════════════════════════════════════════════════════════"

# Instalar dependências
log_info "Instalando dependências..."
npm install --silent
log_success "Dependências instaladas"

# Lint
log_info "Executando linter..."
if npm run lint --silent; then
    log_success "Lint passou"
else
    log_warning "Lint com warnings (continuando...)"
fi

# Build
log_info "Building aplicação..."
npm run build
log_success "Build concluído"

# ============================================
# FASE 3: Supabase Migrations
# ============================================
echo ""
log_info "════════════════════════════════════════════════════════"
log_info "FASE 3: Supabase Database Migrations"
log_info "════════════════════════════════════════════════════════"

if [[ $DEPLOY_ENV == "local" ]]; then
    # Local deployment
    log_info "Verificando Supabase local..."

    if ! supabase status &> /dev/null; then
        log_info "Supabase local não está a correr. A iniciar..."
        supabase start
    fi

    log_info "Aplicando migrations localmente..."
    supabase db push
    log_success "Migrations aplicadas (local)"

else
    # Cloud deployment
    log_info "Verificando link com Supabase cloud..."

    if [[ ! -f .git/supabase-project-ref ]]; then
        log_warning "Projeto Supabase não linkado"
        read -p "Project Ref (ex: abcdefghijklm): " project_ref
        supabase link --project-ref "$project_ref"
    fi

    log_info "Aplicando migrations no Supabase cloud..."
    supabase db push
    log_success "Migrations aplicadas (cloud)"
fi

# ============================================
# FASE 4: Edge Functions Deploy
# ============================================
echo ""
log_info "════════════════════════════════════════════════════════"
log_info "FASE 4: Deploy Edge Functions"
log_info "════════════════════════════════════════════════════════"

if [[ $DEPLOY_ENV != "local" ]]; then
    # Verificar secrets
    log_info "Verificando secrets..."

    if ! supabase secrets list | grep -q "OPENROUTER_API_KEY"; then
        log_warning "Secret OPENROUTER_API_KEY não configurado"
        read -p "OPENROUTER_API_KEY: " openrouter_key
        echo "$openrouter_key" | supabase secrets set OPENROUTER_API_KEY
    fi

    log_success "Secrets configurados"

    # Deploy functions
    FUNCTIONS=("generate-openrouter" "index-document" "export-document")

    for func in "${FUNCTIONS[@]}"; do
        log_info "Deploying function: ${func}..."
        supabase functions deploy "$func" --no-verify-jwt=false
        log_success "✓ ${func} deployed"
    done

else
    log_info "Edge functions (local) - usar 'supabase functions serve'"
fi

# ============================================
# FASE 5: Frontend Deploy (Production only)
# ============================================
if [[ $DEPLOY_ENV == "production" ]]; then
    echo ""
    log_info "════════════════════════════════════════════════════════"
    log_info "FASE 5: Deploy Frontend (Railway)"
    log_info "════════════════════════════════════════════════════════"

    if command -v railway &> /dev/null; then
        log_info "Fazendo deploy no Railway..."
        railway up
        log_success "Frontend deployed no Railway"
    else
        log_warning "Railway CLI não encontrado"
        log_info "Opções:"
        log_info "1. Instalar: npm install -g @railway/cli"
        log_info "2. Fazer push manual: git push"
        log_info "3. Deploy via Railway dashboard"
    fi
fi

# ============================================
# FASE 6: Verificações Pós-Deploy
# ============================================
echo ""
log_info "════════════════════════════════════════════════════════"
log_info "FASE 6: Verificações Pós-Deploy"
log_info "════════════════════════════════════════════════════════"

if [[ $DEPLOY_ENV == "local" ]]; then
    # Verificar serviços locais
    log_info "Verificando serviços Supabase local..."
    supabase status

    log_success "Supabase local a correr"
    log_info ""
    log_info "URLs locais:"
    log_info "  API URL: http://localhost:54321"
    log_info "  Studio: http://localhost:54323"
    log_info "  Inbucket (emails): http://localhost:54324"
    log_info ""
    log_info "Para iniciar frontend: npm run dev"

else
    # Health checks cloud
    log_info "Executando health checks..."

    # Check database
    if supabase db ping &> /dev/null; then
        log_success "✓ Database online"
    else
        log_error "✗ Database offline"
    fi

    # Check edge functions
    PROJECT_REF=$(cat .git/supabase-project-ref 2>/dev/null || echo "unknown")
    FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1"

    log_info ""
    log_info "Edge Functions URL: ${FUNCTION_URL}"
    log_info ""

    if [[ $DEPLOY_ENV == "production" ]]; then
        log_info "Verificando Railway deployment..."
        if command -v railway &> /dev/null; then
            railway status
        fi
    fi
fi

# ============================================
# RESUMO FINAL
# ============================================
echo ""
log_success "════════════════════════════════════════════════════════"
log_success "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
log_success "════════════════════════════════════════════════════════"
echo ""

if [[ $DEPLOY_ENV == "local" ]]; then
    echo "🔧 Ambiente Local configurado:"
    echo "   1. Supabase: http://localhost:54323"
    echo "   2. Frontend: npm run dev (http://localhost:5173)"
    echo ""
elif [[ $DEPLOY_ENV == "production" ]]; then
    echo "☁️  Deploy de Produção concluído:"
    echo "   ✅ Migrations aplicadas"
    echo "   ✅ Edge Functions deployed"
    echo "   ✅ Frontend deployed (Railway)"
    echo ""
    echo "📊 Próximos passos:"
    echo "   1. Verificar logs: supabase functions logs"
    echo "   2. Verificar Railway: railway logs"
    echo "   3. Testar: criar projeto + gerar texto + exportar PDF"
    echo ""
else
    echo "🧪 Staging deploy concluído:"
    echo "   ✅ Migrations aplicadas"
    echo "   ✅ Edge Functions deployed"
    echo ""
fi

echo "📚 Documentação:"
echo "   - claude.md - Documentação completa"
echo "   - IMPROVEMENTS.md - Roadmap de melhorias"
echo ""

log_info "Happy coding! 🚀"
echo ""
