
# PT2030 Candidaturas - Turismo de Portugal

Plataforma de gestão de candidaturas PT2030 para o Turismo de Portugal, permitindo upload de documentos, indexação RAG, geração de texto com IA, e exportação em PDF/DOCX.

## Funcionalidades

- ✅ Autenticação com Supabase Auth
- ✅ Upload e indexação de documentos (PDF/Excel)
- ✅ RAG (Retrieval Augmented Generation) para análise de documentos
- ✅ Geração de texto com IA (GPT-4o, Gemini, Claude)
- ✅ Editor de secções com contador de caracteres
- ✅ Exportação em PDF e DOCX

## Stack Tecnológica

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Storage, Database com pgvector)
- **LLM Integration**: Flowise API
- **Deployment**: Railway

## Configuração do Projeto

### Pré-requisitos

- Node.js 16+ e npm
- Conta Supabase
- Instância Flowise (para geração de texto com IA)

### Instalação

1. Clone o repositório
```sh
git clone https://github.com/turismo-portugal/pt2030-candidaturas.git
cd pt2030-candidaturas
```

2. Instale as dependências
```sh
npm install
```

3. Configure as variáveis de ambiente
```sh
cp .env.local.example .env.local
```
Edite o arquivo `.env.local` com as suas credenciais de Supabase e Flowise.

4. Inicie o servidor de desenvolvimento
```sh
npm run dev
```

### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Configure as seguintes tabelas:

```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'draft',
  progress INTEGER DEFAULT 0
);

-- Sections table
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT DEFAULT '',
  char_limit INTEGER DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Document chunks table with vector embeddings
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  file_id UUID NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX document_chunks_embedding_idx ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Indexed files table
CREATE TABLE indexed_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generations log table
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  section_key TEXT NOT NULL,
  model TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exports table
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  format TEXT NOT NULL,
  language TEXT DEFAULT 'pt',
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  document_url TEXT NOT NULL
);

-- RLS policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);

-- Apply similar RLS policies to other tables
```

3. Configure o bucket de storage:
   - Crie um bucket chamado `documents`
   - Configure as políticas de acesso apropriadas

### Deploy com Railway

1. Configure sua conta no [Railway](https://railway.app)
2. Adicione o projeto ao Railway:
```sh
railway link
railway up
```

## Desenvolvimento

### Estrutura do Projeto

```
pt2030-candidaturas/
├── src/
│   ├── components/       # Componentes React reutilizáveis
│   ├── context/          # Contextos React (Auth, AI)
│   ├── lib/              # Bibliotecas e utilitários
│   ├── pages/            # Páginas da aplicação
│   │   ├── api/          # API endpoints
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Funções utilitárias
├── public/               # Arquivos estáticos
└── ...
```

## Licença

© 2023-2025 Turismo de Portugal. Todos os direitos reservados.
