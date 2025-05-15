
# PT2030 Candidaturas - Gerador de Candidaturas com IA

Uma aplicação web para criar e gerir candidaturas para programas PT2030 assistida por inteligência artificial.

## Tecnologias

- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn/UI
- **Backend**: Supabase (Auth, Storage, Database, Vector Store)
- **IA**: Integração com Flowise API para geração de texto
- **Deployment**: Railway (CI/CD automático)

## Requisitos

- Node.js 18+
- Conta no Supabase (gratuita)
- Conta no Railway (opcional para deploy)
- Endpoint Flowise (para geração de texto com IA)

## Configuração do Ambiente

1. **Clone o repositório**

```bash
git clone https://github.com/seu-usuario/pt2030-candidaturas.git
cd pt2030-candidaturas
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

Copie o arquivo `.env.local.example` para `.env.local`:

```bash
cp .env.local.example .env.local
```

E atualize com as suas credenciais:

```
# Supabase Configuration
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# Flowise AI Integration
VITE_FLOWISE_URL=sua_url_do_flowise
VITE_FLOWISE_API_KEY=sua_chave_api_do_flowise

# Railway Deployment (apenas para produção)
VITE_PUBLIC_URL=sua_url_publica
```

4. **Configuração do Supabase**

- Crie um novo projeto no Supabase
- Configure os buckets de Storage para armazenar documentos
- Configure o banco de dados (as tabelas serão criadas automaticamente na primeira execução)
- Configure a autenticação por email

## Desenvolvimento Local

Execute o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

## Estrutura de Arquivos

```
/
├── public/             # Arquivos estáticos
├── src/                # Código fonte
│   ├── api/            # Funções de API (geração, indexação, exportação)
│   ├── components/     # Componentes React reutilizáveis
│   ├── context/        # Contextos React (Auth, AI)
│   ├── hooks/          # Hooks personalizados
│   ├── lib/            # Bibliotecas e utilitários
│   ├── pages/          # Páginas da aplicação
│   └── types/          # Definições de tipos TypeScript
├── supabase/           # Configurações e funções edge do Supabase
└── .github/workflows/  # Configurações de CI/CD
```

## Deploy no Railway

1. **Configure sua conta no Railway**

Crie uma conta no [Railway](https://railway.app/) se ainda não tiver uma.

2. **Deploy da aplicação**

```bash
# Instale a CLI do Railway (se ainda não tiver)
npm i -g @railway/cli

# Login na sua conta
railway login

# Deploy da aplicação
railway up
```

3. **Configure variáveis de ambiente no Railway**

Configure as mesmas variáveis de ambiente do arquivo `.env.local` no dashboard do Railway.

## Funcionalidades

- **Autenticação**: Sistema completo de login, registro e recuperação de senha
- **Projetos**: Crie e gerencie múltiplos projetos de candidaturas
- **Editor de Seções**: Editor de texto com contagem de caracteres e limites por seção
- **Geração com IA**: Gere conteúdos específicos para cada seção do seu projeto
- **Upload de Documentos**: Faça upload de documentos relevantes (PDFs, Excel)
- **Indexação Vetorial**: Indexação automática dos documentos para consulta pela IA
- **Exportação**: Exporte seu dossiê completo em formato PDF ou DOCX

## Contribuições

Contribuições são bem-vindas! Por favor, abra uma issue para discutir mudanças antes de enviar um pull request.

## Licença

[MIT](LICENSE)
