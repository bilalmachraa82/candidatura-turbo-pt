
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0'

// Configurar cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Função principal servida pela Edge Function
serve(async (req) => {
  // Lidar com requests de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obter dados da requisição
    const formData = await req.formData()
    const projectId = formData.get('projectId')?.toString()
    const file = formData.get('file')

    // Validar input
    if (!projectId || !file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ success: false, error: 'projectId e file são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Fazer upload do arquivo para o Storage
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

    // 2. Obter URL pública do arquivo
    const { data: { publicUrl } } = supabase
      .storage
      .from('project-documents')
      .getPublicUrl(filePath)

    // 3. Registrar arquivo no banco de dados
    const { data: fileData, error: fileError } = await supabase
      .from('indexed_files')
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_type: file.type,
        file_url: publicUrl,
        file_size: file.size,
        status: 'indexed'
      })
      .select()
      .single()

    if (fileError) {
      throw new Error(`Erro ao registrar arquivo: ${fileError.message}`)
    }

    // 4. Processar arquivo para indexação de embeddings (simulação simplificada)
    // Em um ambiente de produção, isso seria feito com processamento assíncrono
    const fileId = fileData.id
    const fileContent = await file.text()
    
    // Dividir o texto em chunks menores (simplificado para demonstração)
    const chunks = fileContent.match(/.{1,1000}/g) || []
    
    // Inserir chunks na tabela document_chunks
    for (let i = 0; i < chunks.length; i++) {
      await supabase
        .from('document_chunks')
        .insert({
          project_id: projectId,
          file_id: fileId,
          chunk_index: i,
          content: chunks[i],
          metadata: {
            source: file.name,
            page: Math.floor(i / 4) + 1 // Simulação simplificada de páginas
          }
          // Nota: em uma implementação real, calcularia embeddings aqui
        })
    }

    // 5. Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Documento indexado com sucesso',
        file: {
          id: fileData.id,
          name: file.name,
          type: file.type,
          url: publicUrl
        }
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
