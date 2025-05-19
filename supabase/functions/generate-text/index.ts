
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
    const body = await req.json()
    const { projectId, section, charLimit = 2000, model = 'gpt-4o' } = body

    // Validar input
    if (!projectId || !section) {
      return new Response(
        JSON.stringify({ success: false, error: 'projectId e section são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Recuperar chunks relevantes do banco de dados
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('id, content, metadata')
      .eq('project_id', projectId)
      .limit(10)

    if (chunksError) {
      throw new Error(`Erro ao buscar chunks: ${chunksError.message}`)
    }

    // 2. Preparar contexto para o Flowise
    const context = chunks.map(chunk => chunk.content).join('\n\n')
    
    // 3. Preparar fontes para o frontend
    const sources = chunks.map(chunk => {
      const metadata = chunk.metadata || {}
      return {
        id: chunk.id,
        name: metadata.source || 'Documento sem nome',
        type: 'document',
        reference: `Página ${metadata.page || '?'}`
      }
    })

    // 4. Chamar a API do Flowise
    const flowiseUrl = Deno.env.get('FLOWISE_URL')
    const flowiseApiKey = Deno.env.get('FLOWISE_API_KEY')

    if (!flowiseUrl) {
      throw new Error('FLOWISE_URL não está configurado')
    }

    const flowiseResponse = await fetch(`${flowiseUrl}/api/v1/prediction/flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': flowiseApiKey ? `Bearer ${flowiseApiKey}` : ''
      },
      body: JSON.stringify({
        question: `Escreva uma seção de ${section} para um projeto PT2030 com aproximadamente ${charLimit} caracteres.`,
        context: context,
        overrideConfig: {
          model: model,
          maxTokens: Math.floor(charLimit / 4)
        }
      })
    })

    if (!flowiseResponse.ok) {
      const flowiseError = await flowiseResponse.text()
      throw new Error(`Erro do Flowise: ${flowiseError}`)
    }

    const flowiseResult = await flowiseResponse.json()
    const generatedText = flowiseResult.text || flowiseResult.answer || ''
    
    // 5. Limitar o texto gerado ao tamanho solicitado
    const finalText = generatedText.substring(0, charLimit)

    // 6. Registrar geração no banco de dados
    await supabase
      .from('generations')
      .insert({
        project_id: projectId,
        section_key: section,
        model: model
      })

    // 7. Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        text: finalText,
        charsUsed: finalText.length,
        sources: sources
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Erro na geração de texto:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor',
        text: '',
        charsUsed: 0,
        sources: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
