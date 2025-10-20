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
