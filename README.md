
# Candidaturas PT2030

Aplicação para auxiliar na geração e gestão de candidaturas a fundos PT2030 utilizando Supabase, React e IA generativa.

## 🚀 Principais Funcionalidades

- **Autenticação Segura**: Sistema completo de login/registro utilizando Supabase Auth.
- **Gestão de Projetos**: Criação e gerenciamento de projetos de candidatura.
- **Indexação de Documentos**: Upload e processamento de documentos (PDFs, Word, Excel) utilizando pgvector.
- **Geração de Texto com IA**: Utilização do Flowise para gerar seções de documentos baseadas em contexto.
- **RAG (Retrieval Augmented Generation)**: Integração com documentos indexados para gerar conteúdo contextualizado.
- **Exportação de Documentos**: Exportação de candidaturas em PDF e DOCX.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Auth, Storage, Database), Flowise (IA)
- **Vectorização**: pgvector no Supabase
- **Deployment**: Railway

## 🔧 Instalação e Configuração

### Pré-requisitos

- Node.js (v18+)
- npm ou yarn
- Conta no Supabase
- Instância Flowise (opcional)

### Configuração

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/candidaturas-pt2030.git
cd candidaturas-pt2030
```

2. Instale as dependências:
```bash
npm install
# ou
yarn
```

3. Copie o arquivo `.env.local.example` para `.env.local` e preencha os valores:
```bash
cp .env.local.example .env.local
```

4. Configure suas variáveis de ambiente:
- `VITE_SUPABASE_URL`: URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY`: Chave anônima do Supabase
- `VITE_FLOWISE_URL`: URL da instância Flowise (opcional)
- `VITE_FLOWISE_API_KEY`: API Key do Flowise (opcional)

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

### Configuração do Supabase

1. Crie um novo projeto no Supabase
2. Execute as migrações necessárias de banco de dados (consulte a pasta `supabase/migrations`)
3. Configure a autenticação conforme necessário

## 🚀 Deployment

### Railway

1. Conecte seu repositório Git ao Railway
2. Configure as variáveis de ambiente necessárias
3. Deploy automático a partir das configurações no arquivo `railway.toml`

## 📝 Estrutura do Projeto

```
/src
  /api          # Funções para chamadas de API
  /components   # Componentes React reutilizáveis
  /context      # Contextos React (Auth, AI, etc.)
  /hooks        # Custom hooks
  /lib          # Bibliotecas e utilitários
  /pages        # Componentes de página
  /types        # Definições de tipos TypeScript
  /utils        # Funções utilitárias
```

## 📚 Documentação Adicional

- [Supabase](https://supabase.com/docs)
- [pgvector](https://github.com/pgvector/pgvector)
- [Flowise](https://docs.flowiseai.com/)
- [Railway](https://docs.railway.app/)

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.
