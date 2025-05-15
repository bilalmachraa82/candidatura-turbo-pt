
# PT2030 - Candidaturas App

Web application for managing PT2030 funding applications with AI-assisted document generation.

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd pt2030-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file and update with your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase and Flowise credentials.

### 4. Run the development server

```bash
npm run dev
```

The app will be available at http://localhost:3000.

### 5. Deployment

To deploy to Railway:

```bash
railway up
```

## Features

- Document upload and indexing with RAG
- AI-assisted content generation
- Export to PDF and DOCX formats
- Authentication and project management
- Real-time collaboration

## Technologies

- React + TypeScript
- Supabase (Auth, Storage, pgvector)
- TailwindCSS + shadcn/ui
- Flowise AI API integration
- Railway deployment
