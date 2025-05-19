
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
    if (req.method !== 'GET') {
      return new Response(
        JSON.stringify({ success: false, error: 'Método não permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Obter parâmetros da URL
    const url = new URL(req.url)
    const projectId = url.searchParams.get('projectId')
    const format = url.searchParams.get('format') || 'pdf'
    const language = url.searchParams.get('language') || 'pt'
    const includeAttachments = url.searchParams.get('attachments') === 'true'

    // Validar input
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'projectId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Obter dados do projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) {
      throw new Error(`Erro ao buscar projeto: ${projectError.message}`)
    }

    // 2. Obter seções do projeto
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (sectionsError) {
      throw new Error(`Erro ao buscar seções: ${sectionsError.message}`)
    }

    // 3. Obter anexos se necessário
    let attachments = []
    if (includeAttachments) {
      const { data: files, error: filesError } = await supabase
        .from('indexed_files')
        .select('*')
        .eq('project_id', projectId)

      if (filesError) {
        throw new Error(`Erro ao buscar anexos: ${filesError.message}`)
      }
      
      attachments = files || []
    }

    // 4. Chamar a API do Flowise para exportação
    const flowiseUrl = Deno.env.get('FLOWISE_URL')
    const flowiseApiKey = Deno.env.get('FLOWISE_API_KEY')

    if (!flowiseUrl) {
      throw new Error('FLOWISE_URL não está configurado')
    }

    // Simular resultado de exportação (em uma implementação real, chamaria o Flowise)
    // Esta simulação seria substituída pela chamada real ao serviço Flowise
    const exportUrl = `${flowiseUrl}/api/v1/export/download/${projectId}?format=${format}&lang=${language}`
    
    // 5. Retornar URL para o arquivo exportado
    return new Response(
      JSON.stringify({
        success: true,
        url: exportUrl,
        fileName: `projeto-${projectId}.${format}`,
        format: format,
        sections: sections.length,
        attachments: attachments.length,
        metadata: {
          projectName: project.title,
          exportDate: new Date().toISOString(),
          pageCount: Math.ceil(sections.length * 1.5),
          language: language
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na exportação:', error)
    
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
