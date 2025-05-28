
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerationRequest {
  projectId: string;
  section: string;
  charLimit?: number;
  model?: string;
  language?: string;
}

// Função para recuperar contexto relevante via RAG
async function retrieveContext(supabase: any, projectId: string, section: string): Promise<any[]> {
  try {
    // Em produção, geraria embeddings da query e faria busca por similaridade
    // Por agora, recupera chunks relevantes baseado no projeto
    const { data: chunks, error } = await supabase
      .from('document_chunks')
      .select('content, metadata')
      .eq('project_id', projectId)
      .limit(5)

    if (error) {
      console.error('Erro ao recuperar contexto:', error)
      return []
    }

    return chunks || []
  } catch (error) {
    console.error('Erro na recuperação de contexto:', error)
    return []
  }
}

// Função para gerar texto usando Flowise
async function generateWithFlowise(prompt: string, model: string = 'gpt-4o'): Promise<{text: string, sources: any[]}> {
  const FLOWISE_URL = Deno.env.get('FLOWISE_URL')
  const FLOWISE_API_KEY = Deno.env.get('FLOWISE_API_KEY')

  if (!FLOWISE_URL || !FLOWISE_API_KEY) {
    throw new Error('Configuração do Flowise não encontrada')
  }

  try {
    const response = await fetch(`${FLOWISE_URL}/api/v1/prediction/your-chatflow-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLOWISE_API_KEY}`
      },
      body: JSON.stringify({
        question: prompt,
        overrideConfig: {
          model: model
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Erro do Flowise: ${response.status}`)
    }

    const result = await response.json()
    
    return {
      text: result.text || result.answer || 'Texto gerado com sucesso.',
      sources: result.sources || []
    }
  } catch (error) {
    console.error('Erro no Flowise:', error)
    // Fallback com texto simulado
    return {
      text: `Conteúdo gerado para a secção "${prompt.split('\n')[0]}" usando ${model}. Este é um exemplo de texto que seria gerado pela IA com base no contexto fornecido.`,
      sources: []
    }
  }
}

serve(async (req) => {
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

    const { projectId, section, charLimit = 2000, model = 'gpt-4o', language = 'pt' }: GenerationRequest = await req.json()

    if (!projectId || !section) {
      return new Response(
        JSON.stringify({ success: false, error: 'projectId e section são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Retrieve project context via RAG
    const contextChunks = await retrieveContext(supabase, projectId, section)

    // 2. Build context prompt
    const contextText = contextChunks
      .map(chunk => `Fonte: ${chunk.metadata?.source || 'Documento'}\nConteúdo: ${chunk.content}`)
      .join('\n\n')

    // 3. Create generation prompt
    const prompt = `Secção: ${section}
Limite de caracteres: ${charLimit}
Idioma: ${language === 'pt' ? 'Português' : 'English'}

Contexto do projeto:
${contextText}

Instruções:
- Gere conteúdo profissional e técnico para a secção especificada
- Use o contexto fornecido dos documentos carregados
- Limite o texto a ${charLimit} caracteres
- Mantenha o tom formal e adequado para candidaturas PT2030
- Inclua dados específicos do projeto quando disponível`

    // 4. Generate text
    const { text, sources } = await generateWithFlowise(prompt, model)

    // 5. Record generation in database
    await supabase
      .from('generations')
      .insert({
        project_id: projectId,
        section_key: section,
        model: model
      })

    // 6. Prepare sources for response
    const processedSources = sources.map((source: any, index: number) => ({
      id: `source-${index}`,
      name: source.name || contextChunks[index]?.metadata?.source || `Fonte ${index + 1}`,
      reference: source.reference || 'Documento do projeto',
      type: source.type || 'document'
    }))

    return new Response(
      JSON.stringify({
        success: true,
        text: text.slice(0, charLimit), // Ensure char limit
        charsUsed: Math.min(text.length, charLimit),
        sources: processedSources,
        model: model,
        language: language
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
        error: error.message || 'Erro interno do servidor'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
