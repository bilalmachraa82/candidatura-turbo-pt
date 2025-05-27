
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, section, charLimit = 1500, model = "google/gemini-2.0-flash-exp" } = await req.json();
    
    console.log('OpenRouter generation request:', { projectId, section, charLimit, model });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // RAG: Fetch relevant document chunks
    const { data: chunks, error: chunksError } = await supabase.rpc('match_document_chunks', {
      query_embedding: null, // We'll use text search as fallback
      match_threshold: 0.1,
      match_count: 8,
      p_project_id: projectId
    });

    if (chunksError) {
      console.warn('Error fetching chunks, proceeding without context:', chunksError);
    }

    const context = chunks && chunks.length > 0 
      ? chunks.map((chunk: any) => `• ${chunk.content}`).join('\n')
      : 'Não foram encontrados documentos relevantes para este projeto.';

    console.log('RAG context length:', context.length);

    // Prepare messages for OpenRouter
    const messages = [
      {
        role: "system",
        content: `Estás a escrever para o formulário PT2030, secção "${section}". Regras:
1. Português de Portugal, formal e técnico
2. Usa apenas as fontes documentais fornecidas abaixo
3. Máximo ${charLimit} caracteres
4. Se excederes, corta elegantemente e termina com "..."
5. Foca em aspectos inovadores e de impacto económico
6. Inclui métricas quantificáveis quando possível

==== FONTES DOCUMENTAIS ====
${context}
====

Gera uma resposta completa e bem estruturada para a secção "${section}".`
      },
      { 
        role: "user", 
        content: `Gera agora o conteúdo para a secção "${section}" do formulário PT2030.` 
      }
    ];

    // Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pt2030-candidaturas.lovable.app',
        'X-Title': 'PT2030 Candidaturas App'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: Math.min(1500, Math.floor(charLimit / 2)),
        temperature: 0.2,
        top_p: 0.9,
        frequency_penalty: 0.1
      })
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${openRouterResponse.status} - ${errorText}`);
    }

    const openRouterResult = await openRouterResponse.json();
    console.log('OpenRouter response received');

    let generatedText = openRouterResult.choices?.[0]?.message?.content?.trim() || '';
    
    // Trim to character limit
    if (generatedText.length > charLimit) {
      generatedText = generatedText.slice(0, charLimit - 3) + '...';
    }

    // Map chunks to sources for UI
    const sources = chunks?.slice(0, 5).map((chunk: any, index: number) => ({
      id: chunk.id || `source-${index}`,
      name: chunk.metadata?.source || `Documento ${index + 1}`,
      type: 'document',
      reference: chunk.metadata?.page ? `Página ${chunk.metadata.page}` : 'Documento de referência'
    })) || [];

    // Log generation for analytics
    try {
      await supabase.from('generations').insert({
        project_id: projectId,
        section_key: section,
        model: `openrouter:${model}`
      });
    } catch (dbError) {
      console.warn('Error logging generation:', dbError);
    }

    const result = {
      text: generatedText,
      charsUsed: generatedText.length,
      sources,
      provider: 'openrouter',
      model
    };

    console.log('OpenRouter generation completed:', { charsUsed: result.charsUsed, sourcesCount: sources.length });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in OpenRouter generation:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erro desconhecido na geração OpenRouter',
      provider: 'openrouter'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
