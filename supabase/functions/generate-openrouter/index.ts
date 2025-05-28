
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate query embedding for semantic search
async function generateQueryEmbedding(query: string): Promise<number[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    console.warn('OPENAI_API_KEY not found, skipping semantic search');
    return [];
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query,
        model: 'text-embedding-3-small',
        encoding_format: 'float'
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    return [];
  }
}

serve(async (req) => {
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

    // Create search query combining section name and context
    const searchQuery = `${section} candidatura Portugal 2030 projecto inovação`;
    
    // Generate embedding for semantic search
    const queryEmbedding = await generateQueryEmbedding(searchQuery);
    
    let chunks: any[] = [];
    
    if (queryEmbedding.length > 0) {
      // Semantic search using embeddings
      console.log('Performing semantic search with embeddings');
      
      const { data: semanticChunks, error: semanticError } = await supabase.rpc('match_document_chunks', {
        query_embedding: `[${queryEmbedding.join(',')}]`,
        match_threshold: 0.1,
        match_count: 8,
        p_project_id: projectId
      });

      if (semanticError) {
        console.warn('Semantic search failed:', semanticError);
      } else {
        chunks = semanticChunks || [];
      }
    }
    
    // Fallback to keyword search if semantic search fails or no results
    if (chunks.length === 0) {
      console.log('Falling back to keyword search');
      
      const { data: keywordChunks, error: keywordError } = await supabase
        .from('document_chunks')
        .select('id, content, metadata')
        .eq('project_id', projectId)
        .textSearch('content', searchQuery.split(' ').join(' | '))
        .limit(6);
      
      if (!keywordError && keywordChunks) {
        chunks = keywordChunks.map(chunk => ({
          ...chunk,
          similarity: 0.5 // Default similarity for keyword search
        }));
      }
    }

    // Build context from retrieved chunks
    const context = chunks && chunks.length > 0 
      ? chunks
          .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
          .slice(0, 6)
          .map((chunk: any) => `• ${chunk.content}`)
          .join('\n')
      : 'Não foram encontrados documentos relevantes para este projeto.';

    console.log(`RAG context: ${context.length} characters from ${chunks.length} chunks`);

    // Enhanced prompt for PT2030 applications
    const systemPrompt = `És um especialista em candidaturas ao programa PT2030 (Portugal 2030). 

TAREFA: Escrever conteúdo técnico para a secção "${section}" de uma candidatura.

REGRAS OBRIGATÓRIAS:
1. Português de Portugal, formal e técnico
2. Máximo ${charLimit} caracteres
3. Usar APENAS as fontes documentais fornecidas
4. Incluir métricas quantificáveis quando possível
5. Focar em inovação, impacto económico e sustentabilidade
6. Estrutura clara com parágrafos bem definidos
7. Se excederes o limite, corta elegantemente com "..."

CRITÉRIOS PT2030:
- Demonstrar inovação tecnológica e metodológica
- Evidenciar viabilidade económica e técnica
- Mostrar impacto territorial e social
- Comprovar sustentabilidade ambiental
- Indicar parcerias estratégicas

==== CONTEXTO DOCUMENTAL ====
${context}
====

Gera conteúdo profissional e convincente para a secção "${section}".`;

    const messages = [
      { role: "system", content: systemPrompt },
      { 
        role: "user", 
        content: `Redige agora o conteúdo para "${section}" baseado nos documentos fornecidos. Máximo ${charLimit} caracteres.` 
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
        max_tokens: Math.min(2000, Math.floor(charLimit / 2)),
        temperature: 0.2,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.05
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
    
    // Trim to character limit with smart truncation
    if (generatedText.length > charLimit) {
      const truncated = generatedText.slice(0, charLimit - 3);
      const lastSentence = truncated.lastIndexOf('.');
      const lastParagraph = truncated.lastIndexOf('\n');
      
      const cutPoint = Math.max(lastSentence, lastParagraph);
      if (cutPoint > charLimit * 0.8) {
        generatedText = truncated.slice(0, cutPoint + 1) + '...';
      } else {
        generatedText = truncated + '...';
      }
    }

    // Map chunks to sources for UI
    const sources = chunks?.slice(0, 5).map((chunk: any, index: number) => ({
      id: chunk.id || `source-${index}`,
      name: chunk.metadata?.source || `Documento ${index + 1}`,
      type: 'document',
      reference: chunk.metadata?.page ? `Página ${chunk.metadata.page}` : 'Documento de referência',
      similarity: chunk.similarity || 0
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
      model,
      chunksUsed: chunks.length,
      searchMethod: queryEmbedding.length > 0 ? 'semantic' : 'keyword'
    };

    console.log('Generation completed:', { 
      charsUsed: result.charsUsed, 
      sourcesCount: sources.length,
      searchMethod: result.searchMethod
    });

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
