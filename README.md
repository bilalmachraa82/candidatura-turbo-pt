
# Candidaturas PT2030

Plataforma para gestão e criação de candidaturas ao programa PT2030 utilizando IA generativa e RAG (Retrieval Augmented Generation).

## Tecnologias

- **Frontend**: React, Vite, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Supabase (Auth, Storage, Banco de dados PostgreSQL com pgvector)
- **IA/RAG**: Flowise AI para geração de texto com RAG
- **Deploy**: Railway

## Configuração

### Requisitos

- Node.js 18+ e npm
- Conta Supabase (gratuita)
- Conta Railway (opcional, para deploy)
- Endpoint Flowise (para geração de texto com IA)

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/your-username/candidaturas-pt2030.git
cd candidaturas-pt2030
```

2. Instale as dependências:

```bash
npm install
```

3. Copie o arquivo `.env.local.example` para `.env.local` e preencha as variáveis:

```bash
cp .env.local.example .env.local
```

4. Configure suas variáveis de ambiente:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_FLOWISE_URL=your_flowise_url_here
VITE_FLOWISE_API_KEY=your_flowise_api_key_here
```

### Configuração do Supabase

1. Crie um projeto no Supabase
2. Configure as seguintes tabelas:

```sql
-- Projetos
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documentos
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  public_url TEXT,
  indexed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secções de projetos
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela para embedding de documentos
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID REFERENCES documents(id) NOT NULL,
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

3. Configure políticas RLS (Row Level Security) para proteger os dados:

```sql
-- Políticas para projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents from their own projects"
  ON documents FOR SELECT
  USING ((SELECT user_id FROM projects WHERE id = documents.project_id) = auth.uid());

CREATE POLICY "Users can insert documents into their own projects"
  ON documents FOR INSERT
  WITH CHECK ((SELECT user_id FROM projects WHERE id = documents.project_id) = auth.uid());

-- Políticas para sections
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sections from their own projects"
  ON sections FOR SELECT
  USING ((SELECT user_id FROM projects WHERE id = sections.project_id) = auth.uid());

CREATE POLICY "Users can insert sections into their own projects"
  ON sections FOR INSERT
  WITH CHECK ((SELECT user_id FROM projects WHERE id = sections.project_id) = auth.uid());

CREATE POLICY "Users can update sections from their own projects"
  ON sections FOR UPDATE
  USING ((SELECT user_id FROM projects WHERE id = sections.project_id) = auth.uid());

-- Políticas para embeddings
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view embeddings from their own documents"
  ON embeddings FOR SELECT
  USING ((SELECT user_id FROM projects WHERE id = 
    (SELECT project_id FROM documents WHERE id = embeddings.document_id)) = auth.uid());

CREATE POLICY "Users can insert embeddings for their own documents"
  ON embeddings FOR INSERT
  WITH CHECK ((SELECT user_id FROM projects WHERE id = 
    (SELECT project_id FROM documents WHERE id = embeddings.document_id)) = auth.uid());
```

### Desenvolvimento

Execute o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará disponível em [http://localhost:5173](http://localhost:5173).

### Deploy com Railway

1. Instale a CLI do Railway:

```bash
npm install -g @railway/cli
```

2. Faça login:

```bash
railway login
```

3. Link ao seu projeto Railway:

```bash
railway link
```

4. Configure as variáveis de ambiente no Railway:

```bash
railway variables set VITE_SUPABASE_URL=your_supabase_url_here
railway variables set VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
railway variables set VITE_FLOWISE_URL=your_flowise_url_here
railway variables set VITE_FLOWISE_API_KEY=your_flowise_api_key_here
```

5. Deploy:

```bash
railway up
```

## Funcionalidades

- **Autenticação**: Login/registro de usuários via Supabase Auth
- **Gestão de projetos**: Criar, editar e listar projetos
- **Upload de documentos**: Fazer upload de documentos PDF e Excel
- **Indexação RAG**: Indexar documentos com embeddings para pesquisa semântica
- **Editor de secções**: Editor WYSIWYG para diferentes secções da candidatura
- **Geração com IA**: Gerar conteúdo para cada secção baseado nos documentos carregados
- **Citações automáticas**: A IA cita automaticamente as fontes utilizadas
- **Exportação**: Exportar o documento final em formato PDF ou DOCX

## Licença

Este projeto está licenciado sob a licença MIT.
