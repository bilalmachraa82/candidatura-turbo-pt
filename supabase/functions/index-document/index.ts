
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função para extrair texto de diferentes tipos de arquivo
async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  
  if (fileType === 'text/plain') {
    return await file.text();
  }
  
  if (fileType === 'application/pdf') {
    // Para PDFs, retornamos o nome do arquivo como placeholder
    // Em produção, usaria uma biblioteca como pdf-parse
    return `Documento PDF: ${file.name}\nConteúdo extraído seria processado aqui.`;
  }
  
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
    return `Planilha Excel: ${file.name}\nDados financeiros e métricas do projeto.`;
  }
  
  // Para outros tipos, retorna informações básicas
  return `Documento: ${file.name}\nTipo: ${fileType}`;
}

// Função para gerar embeddings (simulação)
async function generateEmbeddings(text: string): Promise<number[]> {
  // Em produção, chamaria uma API real de embeddings (OpenAI, Cohere, etc.)
  // Por agora, retorna um vetor aleatório normalizado
  const dimension = 1536; // Dimensão padrão do OpenAI text-embedding-ada-002
  const vector = Array.from({ length: dimension }, () => Math.random() - 0.5);
  
  // Normalizar o vetor
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
}

// Função para dividir texto em chunks
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start = end - overlap;
    
    if (start >= text.length) break;
  }
  
  return chunks;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request
    const formData = await req.formData()
    const projectId = formData.get('projectId')?.toString()
    const file = formData.get('file')

    if (!projectId || !file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ success: false, error: 'projectId e file são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Upload file to storage
    const fileExt = file.name.split('.').pop()
    const filePath = `${projectId}/${Date.now()}.${fileExt}`
    
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('project-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (storageError) {
      throw new Error(`Erro no upload: ${storageError.message}`)
    }

    // 2. Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('project-documents')
      .getPublicUrl(filePath)

    // 3. Extract text content
    const textContent = await extractTextFromFile(file)

    // 4. Register file in database
    const { data: fileData, error: fileError } = await supabase
      .from('indexed_files')
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_type: file.type,
        file_url: publicUrl,
        file_size: file.size,
        status: 'processing'
      })
      .select()
      .single()

    if (fileError) {
      throw new Error(`Erro ao registrar arquivo: ${fileError.message}`)
    }

    // 5. Process text into chunks and generate embeddings
    const chunks = chunkText(textContent)
    const processedChunks = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const embedding = await generateEmbeddings(chunk)
      
      const { data: chunkData, error: chunkError } = await supabase
        .from('document_chunks')
        .insert({
          project_id: projectId,
          file_id: fileData.id,
          chunk_index: i,
          content: chunk,
          metadata: {
            source: file.name,
            page: Math.floor(i / 4) + 1,
            file_type: file.type,
            chunk_size: chunk.length
          },
          embedding: `[${embedding.join(',')}]`
        })
        .select()
        .single()

      if (chunkError) {
        console.error(`Erro ao inserir chunk ${i}:`, chunkError)
        continue
      }

      processedChunks.push(chunkData)
    }

    // 6. Update file status to indexed
    await supabase
      .from('indexed_files')
      .update({ status: 'indexed' })
      .eq('id', fileData.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Documento indexado com sucesso',
        file: {
          id: fileData.id,
          name: file.name,
          type: file.type,
          url: publicUrl
        },
        chunks_processed: processedChunks.length,
        total_chunks: chunks.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na indexação:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
