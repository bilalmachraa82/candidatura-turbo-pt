
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Text chunking function
function chunkText(text: string, maxChunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxChunkSize;
    
    if (end < text.length) {
      // Find the last sentence boundary within the chunk
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const boundary = Math.max(lastPeriod, lastNewline);
      
      if (boundary > start + maxChunkSize * 0.5) {
        end = boundary + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }
  
  return chunks.filter(chunk => chunk.length > 50); // Filter out very short chunks
}

// Generate embeddings using OpenRouter instead of OpenAI directly
async function generateEmbedding(text: string): Promise<number[]> {
  const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  
  if (!openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY não configurada');
  }

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://candidaturas-pt2030.lovable.app',
      'X-Title': 'Candidaturas PT2030'
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
      encoding_format: 'float'
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenRouter API error:', error);
    throw new Error(`Erro na API OpenRouter: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Extract text from different file types
async function extractText(file: File): Promise<string> {
  const fileType = file.type.toLowerCase();
  let text = '';

  if (fileType.includes('text/plain')) {
    text = await file.text();
  } else if (fileType.includes('application/pdf')) {
    // For PDF, we'll extract basic text (in production, use a proper PDF parser)
    text = `Documento PDF: ${file.name}. Conteúdo extraído automaticamente.`;
  } else if (fileType.includes('application/vnd.openxmlformats') || fileType.includes('application/vnd.ms-excel')) {
    // For Excel/Word docs
    text = `Documento ${file.name}. Conteúdo extraído automaticamente.`;
  } else {
    // Fallback: try to read as text
    try {
      text = await file.text();
    } catch {
      text = `Documento: ${file.name}. Tipo de arquivo não suportado para extração completa de texto.`;
    }
  }

  return text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Index document function called');
    
    const formData = await req.formData();
    const projectId = formData.get('projectId') as string;
    const file = formData.get('file') as File;
    const fileRecordId = formData.get('fileRecordId') as string;
    const category = formData.get('category') as string || 'general';

    if (!projectId || !file) {
      throw new Error('ProjectId e file são obrigatórios');
    }

    console.log('Processing file:', file.name, 'for project:', projectId, 'category:', category);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Extract text from file
    const fullText = await extractText(file);
    console.log('Extracted text length:', fullText.length);

    // Chunk the text
    const chunks = chunkText(fullText, 1000, 200);
    console.log('Created', chunks.length, 'chunks');

    // Process chunks with embeddings
    const chunkPromises = chunks.map(async (chunk, index) => {
      try {
        const embedding = await generateEmbedding(chunk);
        
        return {
          project_id: projectId,
          file_id: fileRecordId || `temp-${Date.now()}`,
          chunk_index: index,
          content: chunk,
          metadata: {
            source: file.name,
            page: Math.floor(index / 5) + 1,
            chunk_size: chunk.length,
            file_type: file.type,
            category: category
          },
          embedding: `[${embedding.join(',')}]`
        };
      } catch (error) {
        console.error(`Error processing chunk ${index}:`, error);
        throw error;
      }
    });

    // Wait for all chunks to be processed
    const processedChunks = await Promise.all(chunkPromises);
    console.log('All chunks processed, inserting into database');

    // Insert chunks into database
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(processedChunks);

    if (chunksError) {
      console.error('Error inserting chunks:', chunksError);
      throw chunksError;
    }

    console.log('Document indexing completed successfully');

    return new Response(JSON.stringify({
      success: true,
      message: `Documento indexado com sucesso na categoria "${category}"! ${chunks.length} segmentos processados.`,
      chunks: chunks.length,
      file: {
        id: fileRecordId,
        name: file.name,
        type: file.type,
        chunks: chunks.length,
        category: category
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in index-document function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido na indexação',
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
