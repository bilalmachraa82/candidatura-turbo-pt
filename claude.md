# PT2030 Candidaturas - Documentação Claude Code

## Visão Geral

Aplicação web para gestão de candidaturas ao programa Portugal 2030, com assistência de IA para geração de conteúdo e validação usando RAG (Retrieval-Augmented Generation).

**Stack Tecnológica:**
- **Frontend:** React 18 + Vite + TypeScript + TailwindCSS + Shadcn/UI
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **IA:** OpenRouter (múltiplos modelos LLM, embeddings)
- **Deploy:** Railway + Supabase Hosting

---

## Arquitetura do Projeto

### Estrutura de Pastas

```
/src
├── components/          # Componentes UI (shadcn/ui)
├── pages/              # Páginas (Login, Dashboard, Project)
├── api/                # Chamadas API (generateText, indexDocuments)
├── hooks/              # React hooks customizados
├── context/            # Context providers (Auth, AI)
├── lib/                # Funções utilitárias
├── types/              # Definições TypeScript
├── data/               # Dados estáticos (configuração PT2030)
├── config/             # Gestão de configuração
└── integrations/       # Integrações externas (Supabase)

/supabase
├── config.toml         # Configuração local Supabase
└── functions/          # Edge Functions (Deno serverless)
    ├── generate-openrouter/    # Geração de texto com LLM
    ├── index-document/         # Indexação de documentos
    ├── export-document/        # Exportação (incompleto)
    └── generate-text/          # Legacy Flowise (deprecated)
```

### Funcionalidades Principais

1. **Autenticação de Utilizadores**
   - Login/registo via Supabase Auth
   - Reset de password
   - Sessões persistentes com JWT

2. **Gestão de Projetos**
   - CRUD de projetos PT2030
   - Metadados: título, descrição, orçamento, organização, região
   - Dashboard com listagem e filtros

3. **Editor de Conteúdo**
   - Editor por secções do formulário PT2030
   - Tracking de limites de caracteres
   - Auto-save
   - Geração assistida por IA

4. **Indexação de Documentos (RAG)**
   - Upload de PDFs, Word, Excel, Texto
   - Extração e chunking de texto
   - Geração de embeddings (OpenRouter)
   - Vector database para similarity search
   - Geração contextual com citações de fontes

5. **Geração de Texto com IA**
   - Múltiplos modelos via OpenRouter:
     - **Premium:** Gemini 2.5 Pro, Claude 3.5 Sonnet, GPT-4o
     - **Rápidos:** Gemini 2.0 Flash, Llama 3.2 Vision
     - **Económicos:** Qwen 2.5, Llama 3.3
   - Recomendações de modelo por secção
   - Respeito de limites de caracteres

6. **Exportação** (INCOMPLETO)
   - Preparação de dados para PDF/DOCX
   - Geração efetiva NÃO implementada

---

## PROBLEMAS CRÍTICOS Identificados

### 1. Integração Flowise NÃO Totalmente Removida 🔴

**Problema:**
- Commit recente removeu Flowise, mas código ainda referencia em:
  - `src/api/exportDocument.ts` - ainda chama Flowise API
  - `src/config/env.ts` - ainda valida variáveis Flowise
  - `src/pages/api/health.ts` - health checks Flowise
  - `.env` - credenciais Flowise obsoletas

**Impacto:**
- Exportação vai falhar
- Validação de configuração enganadora
- Variáveis de ambiente confusas

**Ficheiros a corrigir:**
- `/home/user/candidatura-turbo-pt/src/api/exportDocument.ts`
- `/home/user/candidatura-turbo-pt/src/config/env.ts`
- `/home/user/candidatura-turbo-pt/src/pages/api/health.ts`
- `/home/user/candidatura-turbo-pt/.env.local.example`

**Solução:**
```typescript
// Remover todas as referências a:
VITE_FLOWISE_URL
VITE_FLOWISE_API_KEY
```

---

### 2. Variáveis de Ambiente em Falta 🔴

**Problema:**
- `VITE_OPENROUTER_API_KEY` não está documentada
- Edge functions precisam de `OPENROUTER_API_KEY`
- `.env.local.example` desatualizado
- `railway.toml` não inclui OpenRouter

**Impacto:**
- IA não funciona sem API key
- Deploy no Railway vai falhar
- Novos developers ficam bloqueados

**Ficheiros a atualizar:**
- `/home/user/candidatura-turbo-pt/.env.local.example`
- `/home/user/candidatura-turbo-pt/railway.toml`

**Variáveis necessárias:**

```bash
# Frontend (.env.local)
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_OPENROUTER_API_KEY=sk-or-v1-...    # ⚠️ FALTA DOCUMENTAR

# Supabase Edge Functions (secrets via CLI)
OPENROUTER_API_KEY=sk-or-v1-...          # ⚠️ CRÍTICO
```

---

### 3. Função de Base de Dados Pode Não Existir 🔴

**Problema:**
- `match_document_chunks` é chamada em `generate-openrouter/index.ts`
- Função está nos types mas pode não existir no Supabase
- Necessária para vector similarity search (RAG)

**Impacto:**
- RAG vai falhar com erro "function not found"
- Geração contextual não funciona

**Localização:**
- `/home/user/candidatura-turbo-pt/supabase/functions/generate-openrouter/index.ts:95`

**Solução necessária:**
Criar migration SQL:

```sql
-- Habilitar pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar função de similarity search
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_project_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  metadata jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity,
    document_chunks.metadata
  FROM document_chunks
  WHERE document_chunks.project_id = p_project_id
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

### 4. Extensão pgvector Não Configurada 🔴

**Problema:**
- Tabela `document_chunks` tem coluna `embedding vector(1536)`
- Extensão `pgvector` pode não estar ativa
- Sem indexes em embeddings = queries lentas

**Impacto:**
- Indexação de documentos pode falhar
- Similarity search muito lento
- Erros de tipo no PostgreSQL

**Solução:**
Criar migration:

```sql
-- Ativar extensão
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índice adicional por projeto
CREATE INDEX IF NOT EXISTS document_chunks_project_id_idx
ON document_chunks(project_id);
```

---

### 5. Lógica de Update de Projeto Não Implementada 🟡

**Problema:**
- `ProjectPage.tsx` tem TODO: "Implement project update logic"
- UI preparada mas backend sem implementação
- Utilizadores não conseguem editar projetos existentes

**Localização:**
- `/home/user/candidatura-turbo-pt/src/pages/ProjectPage.tsx:45`

**Impacto:**
- Feature incompleta
- Experiência de utilizador degradada

**Solução:**
Implementar função:

```typescript
const updateProject = async (updates: Partial<Project>) => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

---

### 6. Exportação de Documentos Incompleta 🟡

**Problema:**
- Edge function `export-document` retorna URLs simulados
- Não gera PDFs/DOCX reais
- `exportDocument.ts` ainda usa Flowise (removido)

**Ficheiros afetados:**
- `/home/user/candidatura-turbo-pt/supabase/functions/export-document/index.ts`
- `/home/user/candidatura-turbo-pt/src/api/exportDocument.ts`

**Impacto:**
- Utilizadores não conseguem exportar candidaturas
- Feature anunciada mas não funcional

**Solução necessária:**
Implementar geração real usando:
- Bibliotecas: `pdfkit` ou `puppeteer` para PDFs
- Ou: `docx` para ficheiros Word
- Ou: Serviço externo (CloudConvert, DocRaptor)

---

### 7. Componentes Redundantes/Duplicados 🟡

**Problema:**
- Múltiplas versões de mesmo componente:
  - `SectionEditor`, `EnhancedSectionEditor`, `ImprovedSectionEditor`
  - `StorageUploadForm`, `EnhancedUploadForm`

**Impacto:**
- Confusão para developers
- Manutenção difícil
- Bundle size maior

**Solução:**
- Consolidar para 1 versão de cada
- Remover código deprecated

---

### 8. Validação de Configuração Desatualizada 🟠

**Problema:**
- `src/config/env.ts` ainda valida Flowise
- Health check verifica serviços removidos

**Ficheiros:**
- `/home/user/candidatura-turbo-pt/src/config/env.ts`
- `/home/user/candidatura-turbo-pt/src/pages/api/health.ts`

**Solução:**
Atualizar schema para:

```typescript
const envSchema = z.object({
  supabase: z.object({
    url: z.string().url(),
    anonKey: z.string(),
  }),
  openrouter: z.object({
    apiKey: z.string(),
  }),
});
```

---

## Schema da Base de Dados

### Tabelas Principais

#### `projects`
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  budget NUMERIC,
  region TEXT,
  organization TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `sections`
```sql
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  char_limit INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, key)
);
```

#### `indexed_files`
```sql
CREATE TABLE indexed_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  storage_path TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `document_chunks`
```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects ON DELETE CASCADE,
  file_id UUID REFERENCES indexed_files ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),  -- ⚠️ Requer pgvector extension
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `generations`
```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects,
  section_key TEXT,
  model TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

**Estado atual:** Desconhecido - precisa verificação

**Políticas recomendadas:**

```sql
-- Users só veem os seus próprios projetos
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Aplicar também a sections, indexed_files, document_chunks
```

---

## Edge Functions (Supabase)

### `generate-openrouter` ✅ Funcional

**Path:** `/supabase/functions/generate-openrouter/index.ts`

**Propósito:**
- Gerar texto usando modelos OpenRouter com RAG
- Buscar chunks relevantes via vector similarity
- Criar prompts contextualizados
- Retornar texto + citações de fontes

**Input:**
```typescript
{
  projectId: string;
  sectionKey: string;
  model: string;
  customPrompt?: string;
}
```

**Output:**
```typescript
{
  text: string;
  sources?: Array<{
    file_id: string;
    chunk_id: string;
    content: string;
    similarity: number;
  }>;
}
```

**Dependências:**
- `OPENROUTER_API_KEY` (secret)
- `match_document_chunks` function (⚠️ pode não existir)

**Chamada:**
```typescript
const { data, error } = await supabase.functions.invoke('generate-openrouter', {
  body: { projectId, sectionKey, model }
});
```

---

### `index-document` ✅ Funcional

**Path:** `/supabase/functions/index-document/index.ts`

**Propósito:**
- Processar documentos uploaded
- Extrair texto (PDF, DOCX, TXT)
- Dividir em chunks (1000 chars, overlap 200)
- Gerar embeddings via OpenRouter
- Guardar em `document_chunks`

**Input:**
```typescript
FormData {
  file: File;
  projectId: string;
  category?: string;
}
```

**Output:**
```typescript
{
  fileId: string;
  chunksCreated: number;
  status: 'success' | 'error';
}
```

**Dependências:**
- `OPENROUTER_API_KEY` (secret)

**Chamada:**
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('projectId', projectId);

const { data, error } = await supabase.functions.invoke('index-document', {
  body: formData
});
```

---

### `export-document` ❌ Incompleto

**Path:** `/supabase/functions/export-document/index.ts`

**Propósito:**
- Exportar projeto como PDF/DOCX

**Problema:**
- Retorna URLs simulados
- Não gera ficheiros reais
- Lógica placeholder

**Estado:**
```typescript
// MOCK - não funciona!
return new Response(
  JSON.stringify({
    pdfUrl: "https://example.com/mock.pdf",
    docxUrl: "https://example.com/mock.docx"
  }),
  { headers: { "Content-Type": "application/json" } }
);
```

**Precisa:**
- Implementação real com library de geração
- Upload para Supabase Storage
- Retornar URLs assinados

---

### `generate-text` ⚠️ Legacy

**Path:** `/supabase/functions/generate-text/index.ts`

**Estado:** Deprecated (usava Flowise)

**Ação recomendada:** Remover

---

## Configuração de Desenvolvimento

### 1. Setup Inicial

```bash
# Clone
git clone https://github.com/bilalmachraa82/candidatura-turbo-pt.git
cd candidatura-turbo-pt

# Instalar dependências
npm install

# Copiar env
cp .env.local.example .env.local
```

### 2. Configurar Supabase

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar ao projeto
supabase link --project-ref [SEU_PROJECT_REF]

# ⚠️ CRIAR MIGRATIONS em falta:
# supabase/migrations/YYYYMMDDHHMMSS_enable_pgvector.sql
# supabase/migrations/YYYYMMDDHHMMSS_create_match_function.sql

# Push schema
supabase db push
```

### 3. Configurar Edge Functions

```bash
# Definir secrets
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...

# Deploy functions
supabase functions deploy generate-openrouter
supabase functions deploy index-document
```

### 4. Variáveis de Ambiente

Criar `.env.local`:

```bash
# Supabase (obter no dashboard)
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# OpenRouter (https://openrouter.ai/keys)
VITE_OPENROUTER_API_KEY=sk-or-v1-...

# ⚠️ NÃO incluir mais Flowise!
```

### 5. Desenvolvimento Local

```bash
# Start Supabase local (opcional)
supabase start

# Start Vite dev server
npm run dev
```

Abrir: http://localhost:5173

---

## Deploy em Produção

### Railway

```bash
# Instalar CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up

# ⚠️ Configurar variáveis no dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_OPENROUTER_API_KEY
```

**Atualizar `railway.toml`:**

```toml
[build]
builder = "nixpacks"
buildCommand = "npm run build"

[deploy]
startCommand = "npm run preview"
healthcheckPath = "/api/health"
restartPolicyType = "on_failure"

# ⚠️ REMOVER referências a Flowise
```

---

## Migrations SQL em Falta

### Migration 1: Ativar pgvector

Criar: `supabase/migrations/20250120000001_enable_pgvector.sql`

```sql
-- Ativar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar índice em embeddings
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índice por projeto
CREATE INDEX IF NOT EXISTS document_chunks_project_id_idx
ON document_chunks(project_id);

-- Índice por file
CREATE INDEX IF NOT EXISTS document_chunks_file_id_idx
ON document_chunks(file_id);
```

### Migration 2: Função match_document_chunks

Criar: `supabase/migrations/20250120000002_create_match_function.sql`

```sql
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_project_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float,
  metadata jsonb,
  file_id uuid,
  chunk_index int
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity,
    document_chunks.metadata,
    document_chunks.file_id,
    document_chunks.chunk_index
  FROM document_chunks
  WHERE
    document_chunks.project_id = p_project_id
    AND 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Migration 3: Row Level Security

Criar: `supabase/migrations/20250120000003_enable_rls.sql`

```sql
-- Projects RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Sections RLS (cascata de projects)
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sections"
  ON sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = sections.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify own sections"
  ON sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = sections.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Aplicar mesmo padrão a indexed_files, document_chunks, generations
ALTER TABLE indexed_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
  ON indexed_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = indexed_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify own files"
  ON indexed_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = indexed_files.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Repetir para document_chunks e generations
```

---

## Checklist para 100% Funcional

### Configuração Base
- [ ] Ativar extensão `pgvector` no Supabase
- [ ] Criar migration `enable_pgvector.sql`
- [ ] Criar migration `create_match_function.sql`
- [ ] Criar migration `enable_rls.sql`
- [ ] Aplicar migrations: `supabase db push`
- [ ] Configurar secret `OPENROUTER_API_KEY` nas Edge Functions
- [ ] Atualizar `.env.local.example` com variáveis corretas
- [ ] Atualizar `railway.toml` removendo Flowise

### Limpeza de Código
- [ ] Remover referências Flowise em `src/api/exportDocument.ts`
- [ ] Remover validação Flowise em `src/config/env.ts`
- [ ] Remover health check Flowise em `src/pages/api/health.ts`
- [ ] Remover variáveis Flowise de `.env`
- [ ] Consolidar componentes duplicados (SectionEditor, UploadForm)
- [ ] Remover edge function `generate-text` (legacy)

### Features em Falta
- [ ] Implementar lógica de update de projetos em `ProjectPage.tsx`
- [ ] Implementar geração real de PDFs/DOCX em `export-document`
- [ ] Atualizar `exportDocument.ts` para usar nova lógica
- [ ] Adicionar error handling e retry logic
- [ ] Testar upload e indexação de documentos
- [ ] Testar geração de texto com RAG
- [ ] Verificar performance de similarity search

### Testing
- [ ] Testar autenticação (login/registo/reset)
- [ ] Testar CRUD de projetos
- [ ] Testar upload de documentos (PDF, DOCX, TXT, Excel)
- [ ] Testar indexação e chunking
- [ ] Testar geração de texto com diferentes modelos
- [ ] Testar similarity search (RAG funciona?)
- [ ] Testar exportação (quando implementada)
- [ ] Verificar RLS policies funcionam

### Deploy
- [ ] Deploy edge functions: `supabase functions deploy`
- [ ] Configurar variáveis no Railway
- [ ] Verificar health check endpoint
- [ ] Testar em produção

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev                 # Dev server (Vite)
npm run build              # Build produção
npm run preview            # Preview build

# Supabase
supabase status            # Ver serviços locais
supabase db reset          # Reset DB local
supabase db push           # Push migrations
supabase functions serve   # Testar functions localmente
supabase secrets list      # Ver secrets configurados

# Railway
railway status             # Ver status deploy
railway logs               # Ver logs produção
railway open               # Abrir dashboard

# Lint
npm run lint               # ESLint
```

---

## Recursos

### Documentação
- [Supabase Docs](https://supabase.com/docs)
- [OpenRouter API](https://openrouter.ai/docs)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [React Query](https://tanstack.com/query/latest)
- [Shadcn/ui](https://ui.shadcn.com)

### API Keys
- OpenRouter: https://openrouter.ai/keys
- Supabase: Dashboard do projeto

### Dashboards
- Supabase: https://supabase.com/dashboard
- Railway: https://railway.app/dashboard

---

## Arquitetura de IA (RAG)

### Fluxo de Indexação

```
1. User upload documento
   ↓
2. Edge Function: index-document
   ↓
3. Extração de texto (PDF/DOCX/TXT)
   ↓
4. Chunking (1000 chars, overlap 200)
   ↓
5. Geração de embeddings (OpenRouter)
   ↓
6. Guardar em document_chunks (PostgreSQL + pgvector)
```

### Fluxo de Geração

```
1. User pede geração de texto para secção
   ↓
2. Edge Function: generate-openrouter
   ↓
3. Gerar embedding do prompt
   ↓
4. Vector similarity search (match_document_chunks)
   ↓
5. Buscar top 5 chunks mais relevantes
   ↓
6. Criar prompt contextualizado
   ↓
7. Chamar LLM (OpenRouter)
   ↓
8. Retornar texto + citações de fontes
```

### Modelos Disponíveis

**Premium (Qualidade máxima):**
- `google/gemini-2.5-pro-latest` - Melhor para análise profunda
- `anthropic/claude-3.5-sonnet` - Óptimo para escrita criativa
- `openai/gpt-4o` - Versátil, boa reasoning

**Rápidos (Latência baixa):**
- `google/gemini-2.0-flash-exp:free` - Grátis, muito rápido
- `meta-llama/llama-3.2-11b-vision-instruct:free` - Com visão

**Económicos (Custo reduzido):**
- `qwen/qwen-2.5-72b-instruct` - Bom desempenho/preço
- `meta-llama/llama-3.3-70b-instruct` - Open source

---

## Troubleshooting

### Erro: "function match_document_chunks does not exist"

**Causa:** Migration não aplicada

**Solução:**
```bash
# Criar migration (ver secção Migrations SQL)
supabase db push
```

---

### Erro: "column embedding does not exist" ou "type vector does not exist"

**Causa:** pgvector não ativado

**Solução:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### Erro: "OpenRouter API key not configured"

**Causa:** Secret não definido

**Solução:**
```bash
supabase secrets set OPENROUTER_API_KEY=sk-or-v1-...
```

---

### Erro: "Failed to index document"

**Possíveis causas:**
1. API key inválido
2. Documento muito grande
3. Formato não suportado

**Debug:**
```bash
supabase functions logs index-document
```

---

### Geração de texto retorna vazio

**Verificar:**
1. Modelo correto no OpenRouter?
2. Documentos indexados?
3. Similarity threshold muito alto?

**Debug:**
```typescript
// Baixar threshold
const chunks = await supabase.rpc('match_document_chunks', {
  query_embedding,
  match_threshold: 0.3,  // ← Experimentar valores mais baixos
  match_count: 5,
  p_project_id: projectId
});
```

---

## Notas Importantes

1. **Custos OpenRouter:**
   - Embeddings: ~$0.0001 por 1000 tokens
   - LLM calls: varia por modelo ($0.05 - $2 por 1M tokens)
   - Monitorizar uso em: https://openrouter.ai/credits

2. **Limites Supabase:**
   - Free tier: 500MB database, 1GB file storage
   - Edge functions: 500k invocations/mês
   - Considerar upgrade se uso intenso

3. **Segurança:**
   - API keys NUNCA fazer commit
   - RLS policies protegem dados de users
   - Edge functions validam JWT automaticamente

4. **Performance:**
   - pgvector indexes essenciais para similarity search rápido
   - Considerar caching de embeddings
   - Limitar chunk count em queries (default: 5)

---

## Contacto e Suporte

Para issues/bugs: https://github.com/bilalmachraa82/candidatura-turbo-pt/issues

---

**Última atualização:** 2025-10-20 por Claude Code
**Versão:** 1.0.0
