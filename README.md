
# Candidaturas PT2030 - Aplicação Web

Uma aplicação para geração assistida por IA de dossiês de candidatura ao PT2030.

## Funcionalidades

- Autenticação via Supabase
- Criação de projetos de candidatura
- Upload de documentação de suporte (PDF/Excel)
- Indexação vetorial de documentos (pgvector)
- Geração de texto com IA via Flowise
- Edição de secções de candidatura
- Exportação de dossiês em PDF e DOCX

## Stack Tecnológica

- **Frontend**: React + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Autenticação & Base de Dados**: Supabase
- **Armazenamento de Ficheiros**: Supabase Storage
- **Indexação Vetorial**: pgvector (Supabase)
- **Geração de IA**: Flowise API HTTP
- **Deploy**: Railway

## Configuração do Ambiente

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/candidaturas-pt2030.git
cd candidaturas-pt2030
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie o ficheiro `.env.local.example` para `.env.local`
   - Preencha os valores necessários do Supabase e Flowise

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## Deploy com Railway

1. Configure o railway.toml conforme necessário
2. Execute o deploy com um único comando:
```bash
railway up
```

## Estrutura da Base de Dados (Supabase)

### Tabelas Principais:

- **projects** - Projetos de candidatura
- **sections** - Secções de cada projeto
- **indexed_files** - Ficheiros carregados e indexados
- **document_chunks** - Chunks de texto extraídos dos documentos
- **generations** - Registos de geração de texto com IA
- **exports** - Registos de exportações

### Storage Buckets:

- **documents** - Para armazenar os documentos carregados
- **exports** - Para armazenar os dossiês exportados

## Integração com Vector Store

A aplicação utiliza pgvector no Supabase para:
1. Indexar texto extraído dos documentos
2. Criar embeddings para pesquisa semântica
3. Realizar pesquisa de similaridade para RAG (Retrieval-Augmented Generation)

## Integração com Flowise

A aplicação utiliza a API HTTP do Flowise para:
1. Enviar consultas com contexto extraído de documentos
2. Receber texto gerado para as diversas secções da candidatura
3. Aplicar limites de tokens e parâmetros de geração

## Licença

MIT
