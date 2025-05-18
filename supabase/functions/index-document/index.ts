
// Supabase Edge Function para indexação de documentos
// Este arquivo será implantado automaticamente no Supabase Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Definir tipos
interface ExtractedText {
  text: string;
  pages: number;
}

// Versão simplificada de extração de texto para demonstração
const extractTextFromFile = async (fileUrl: string, fileType: string): Promise<ExtractedText> => {
  console.log(`[index-document] Simulando extração de texto de: ${fileUrl} (${fileType})`);
  
  // Em produção, aqui chamaríamos uma API como AWS Textract, PDFTron, etc.
  const mockText = `Conteúdo extraído do arquivo. Este é um texto simulado para fins de demonstração.
  Em um ambiente de produção, o conteúdo real do documento seria extraído usando serviços como
  AWS Textract, Azure Form Recognizer, ou similares.
  
  Este documento contém informações sobre um projeto candidato ao PT2030, incluindo detalhes sobre
  os objetivos, metodologias, cronogramas e orçamentos.
  
  O projeto visa implementar soluções tecnológicas inovadoras para melhorar a eficiência energética
  e reduzir a pegada de carbono em processos industriais.`;
  
  // Simular número de páginas com base no tipo de arquivo
  let pages = 1;
  if (fileType.includes('pdf')) {
    pages = Math.floor(Math.random() * 20) + 5;
  } else if (fileType.includes('doc')) {
    pages = Math.floor(Math.random() * 10) + 3;
  } else if (fileType.includes('xls')) {
    pages = Math.floor(Math.random() * 5) + 1;
  }
  
  return {
    text: mockText,
    pages
  };
};

// Função para dividir texto em chunks
const createTextChunks = (text: string, chunkSize: number = 500): string[] => {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=\.)\s+/);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

// Mock para geração de embeddings
const generateEmbedding = async (text: string): Promise<number[]> => {
  console.log(`[index-document] Simulando geração de embedding para: ${text.substring(0, 50)}...`);
  
  // Em produção, chamaríamos uma API como OpenAI, Cohere, etc.
  // Por ora, geramos um vetor aleatório normalizado de 1536 dimensões
  
  // Usar um hash simples do texto para alguma consistência
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  
  // Usar o hash como seed
  const seed = hash.toString();
  console.log(`[index-document] Usando seed: ${seed} para embeddings`);
  
  // Gerar um vetor de 1536 dimensões (comum em modelos de embeddings)
  const dimensions = 1536;
  const embedding = Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
  
  // Normalizar o vetor
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  const normalizedEmbedding = embedding.map(val => val / norm);
  
  return normalizedEmbedding;
};

// Handler principal da Edge Function
Deno.serve(async (req) => {
  // Verificar método
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Parse do corpo da requisição
    const { fileId } = await req.json();
    
    if (!fileId) {
      return new Response(JSON.stringify({ error: 'Missing fileId in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Criar cliente Supabase usando as variáveis de ambiente da Edge Function
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar informações do arquivo
    const { data: fileData, error: fileError } = await supabase
      .from('indexed_files')
      .select('*')
      .eq('id', fileId)
      .single();
    
    if (fileError || !fileData) {
      return new Response(JSON.stringify({ error: `File not found: ${fileError?.message}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`[index-document] Processando arquivo: ${fileData.file_name}`);
    
    // Atualizar status do arquivo para processamento
    await supabase
      .from('indexed_files')
      .update({ status: 'processing' })
      .eq('id', fileId);
    
    // Extrair texto do arquivo
    const { text, pages } = await extractTextFromFile(fileData.file_url, fileData.file_type);
    
    // Dividir em chunks
    const chunks = createTextChunks(text);
    console.log(`[index-document] Criados ${chunks.length} chunks de texto`);
    
    // Gerar embeddings e armazenar os chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await generateEmbedding(chunk);
      
      // Estimar a página aproximada
      const estimatedPage = Math.floor((i / chunks.length) * pages) + 1;
      
      // Armazenar o chunk e seu embedding
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert({
          project_id: fileData.project_id,
          file_id: fileData.id,
          chunk_index: i,
          content: chunk,
          metadata: {
            source: fileData.file_name,
            page: estimatedPage,
            chunk: i + 1,
            total_chunks: chunks.length
          },
          embedding: embedding
        });

      if (chunkError) {
        console.error(`[index-document] Erro ao armazenar chunk: ${chunkError.message}`);
      }
    }
    
    // Atualizar status do arquivo para indexado
    await supabase
      .from('indexed_files')
      .update({ status: 'indexed' })
      .eq('id', fileId);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Arquivo indexado com sucesso: ${fileData.file_name}`,
      chunks: chunks.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[index-document] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido durante a indexação'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
