
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate embeddings using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
      encoding_format: 'float'
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    throw new Error(`Erro na API OpenAI: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Search for relevant document chunks using vector similarity
async function searchDocuments(supabase: any, projectId: string, query: string, limit: number = 5) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // Search for similar document chunks
    const { data: chunks, error } = await supabase.rpc('match_document_chunks', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_threshold: 0.7,
      match_count: limit,
      p_project_id: projectId
    });

    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }

    return chunks || [];
  } catch (error) {
    console.error('Error in document search:', error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate OpenRouter function called');
    
    const { projectId, section, charLimit, model } = await req.json();

    if (!projectId || !section) {
      throw new Error('ProjectId e section são obrigatórios');
    }

    console.log('Processing request:', { projectId, section, charLimit, model });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get section information from database
    const { data: sectionData, error: sectionError } = await supabase
      .from('sections')
      .select('title, description')
      .eq('project_id', projectId)
      .eq('key', section)
      .single();

    if (sectionError) {
      console.error('Error fetching section:', sectionError);
      throw new Error('Secção não encontrada');
    }

    // Search for relevant documents
    const searchQuery = `${sectionData.title} ${sectionData.description || ''}`;
    const relevantChunks = await searchDocuments(supabase, projectId, searchQuery, 8);
    
    console.log(`Found ${relevantChunks.length} relevant document chunks`);

    // Prepare context from relevant documents
    let context = '';
    const sources = [];
    
    if (relevantChunks.length > 0) {
      context = '\n\nDOCUMENTAÇÃO RELEVANTE:\n';
      relevantChunks.forEach((chunk, index) => {
        context += `\n[${index + 1}] ${chunk.content}\n`;
        sources.push({
          id: chunk.id,
          name: chunk.metadata?.source || 'Documento',
          reference: chunk.content.substring(0, 100) + '...',
          type: 'document',
          title: chunk.metadata?.source || 'Documento do projeto',
          excerpt: chunk.content.substring(0, 200) + '...',
          confidence: chunk.similarity || 0.8
        });
      });
    }

    // Prepare the prompt for text generation
    const prompt = `
Você é um especialista em candidaturas ao programa Portugal 2030. Gere conteúdo para a secção "${sectionData.title}" de uma candidatura.

DESCRIÇÃO DA SECÇÃO: ${sectionData.description || ''}

REQUISITOS:
- Máximo ${charLimit || 2000} caracteres
- Linguagem técnica mas acessível
- Foque nos aspectos mais relevantes para a candidatura
- Use informação da documentação fornecida quando disponível
- Seja específico e concreto

${context}

Gere o conteúdo para a secção "${sectionData.title}":`;

    // Call OpenRouter API
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    
    if (!openrouterApiKey) {
      throw new Error('OPENROUTER_API_KEY não configurada');
    }

    const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://candidaturas-pt2030.lovable.app',
        'X-Title': 'Candidaturas PT2030'
      },
      body: JSON.stringify({
        model: model || 'google/gemini-2.0-flash-exp',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em candidaturas ao programa Portugal 2030. Gere conteúdo profissional e técnico para candidaturas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: Math.min(Math.floor(charLimit * 1.2), 4000)
      })
    });

    if (!openrouterResponse.ok) {
      const errorText = await openrouterResponse.text();
      console.error('OpenRouter API error:', errorText);
      throw new Error(`Erro na API OpenRouter: ${openrouterResponse.status}`);
    }

    const openrouterData = await openrouterResponse.json();
    const generatedText = openrouterData.choices[0].message.content;

    // Log generation for tracking
    await supabase.from('generations').insert({
      project_id: projectId,
      section_key: section,
      model: model || 'google/gemini-2.0-flash-exp'
    });

    console.log('Text generation completed successfully');

    return new Response(JSON.stringify({
      success: true,
      text: generatedText,
      charsUsed: generatedText.length,
      sources: sources,
      chunksUsed: relevantChunks.length,
      searchMethod: relevantChunks.length > 0 ? 'vector' : 'none'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in generate-openrouter function:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido na geração',
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
