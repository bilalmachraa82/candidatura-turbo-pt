
# Candidaturas PT2030 - Aplicação de Gestão de Candidaturas

Esta aplicação facilita a criação, gestão e submissão de candidaturas para programas PT2030, utilizando inteligência artificial para geração assistida de conteúdos.

## Funcionalidades

- **Autenticação segura** via Supabase
- **Upload de documentos** e indexação para RAG (Retrieval Augmented Generation)
- **Geração de texto assistida** por IA usando Flowise
- **Exportação de dossiês** em PDF e DOCX
- **Interface responsiva** com WCAG AA compliance

## Requisitos

- Node.js 16+
- npm ou yarn
- Conta Supabase (gratuita)
- Endpoint Flowise configurado

## Como iniciar

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/candidaturas-pt2030.git
cd candidaturas-pt2030
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
Crie um arquivo `.env.local` com as seguintes variáveis:
```
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase
VITE_FLOWISE_URL=sua_url_flowise
VITE_FLOWISE_API_KEY=sua_chave_api_flowise
```

4. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

5. Deploy para produção via Railway
```bash
railway up
```

## Estrutura do Projeto

- `/src/components` - Componentes React reutilizáveis
- `/src/pages` - Páginas da aplicação
- `/src/hooks` - Custom React hooks
- `/src/context` - Contextos React (Auth, AI, etc.)
- `/src/api` - Funções de interface com APIs externas
- `/src/lib` - Bibliotecas e utilitários
- `/src/types` - Definições de tipos TypeScript

## Tecnologias

- Next.js + React
- TypeScript
- Tailwind CSS
- Supabase (Auth, Storage, Vector DB)
- Flowise AI
- Railway (deploy)

## Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Configure as tabelas necessárias (projetos, secções, ficheiros indexados)
3. Habilite autenticação por email
4. Configure o bucket de storage para documentos

## Contribuição

Para contribuir, por favor:
1. Faça um fork do repositório
2. Crie uma branch para a sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Crie um novo Pull Request
