/**
 * Supabase Edge Function: generate-claude
 *
 * Purpose: Generate AI content using Anthropic Claude SDK with Prompt Caching
 *
 * Cost Optimization Strategy:
 * - Use Claude 3.5 Sonnet for 30% of requests (high-quality sections)
 * - Implement prompt caching to save 90% on input token costs
 * - Cache system context, project info, and RAG documents
 *
 * Cost Breakdown (with caching):
 * - Input tokens: $3.00 per 1M tokens (write), $0.30 per 1M tokens (read from cache)
 * - Output tokens: $15.00 per 1M tokens
 * - Cache TTL: 5 minutes (Anthropic default)
 *
 * Example savings:
 * - Without caching: 2000 input tokens × $3/M = $0.006 per request
 * - With caching: 200 new tokens × $3/M + 1800 cached × $0.30/M = $0.0012 per request
 * - Savings: 80% reduction on input token costs
 *
 * Environment Variables Required:
 * - ANTHROPIC_API_KEY: Anthropic API key (get from https://console.anthropic.com/)
 * - OPENAI_API_KEY: For embeddings generation (RAG)
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 * - SENTRY_DSN: (Optional) Sentry error tracking
 *
 * Setup:
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Anthropic from 'npm:@anthropic-ai/sdk@0.29.0';
import { withSentry, trackSpan } from '../_shared/sentry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate embeddings using OpenAI for RAG
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
async function searchDocuments(supabase: any, projectId: string, query: string, limit: number = 8) {
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

// Calculate estimated cost based on token usage
function calculateCost(usage: {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}): number {
  const INPUT_COST = 3.00 / 1_000_000; // $3 per 1M tokens
  const OUTPUT_COST = 15.00 / 1_000_000; // $15 per 1M tokens
  const CACHE_WRITE_COST = 3.75 / 1_000_000; // $3.75 per 1M tokens to write to cache
  const CACHE_READ_COST = 0.30 / 1_000_000; // $0.30 per 1M tokens to read from cache

  const inputCost = usage.input_tokens * INPUT_COST;
  const outputCost = usage.output_tokens * OUTPUT_COST;
  const cacheWriteCost = (usage.cache_creation_input_tokens || 0) * CACHE_WRITE_COST;
  const cacheReadCost = (usage.cache_read_input_tokens || 0) * CACHE_READ_COST;

  return inputCost + outputCost + cacheWriteCost + cacheReadCost;
}

serve(withSentry(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate Claude function called');

    // Parse and validate request
    const { projectId, section, charLimit, model, customPrompt } = await req.json();

    if (!projectId || !section) {
      throw new Error('ProjectId e section são obrigatórios');
    }

    console.log('Processing request:', { projectId, section, charLimit, model });

    // Get Anthropic API key
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada. Configure com: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch project information
    const { data: project, error: projectError } = await trackSpan(
      'fetch-project',
      'db.query',
      { projectId },
      async () => {
        return await supabase
          .from('projects')
          .select('title, description, budget')
          .eq('id', projectId)
          .single();
      }
    );

    if (projectError) {
      console.error('Error fetching project:', projectError);
      throw new Error('Projeto não encontrado');
    }

    // Fetch section information from database
    const { data: sectionData, error: sectionError } = await trackSpan(
      'fetch-section',
      'db.query',
      { projectId, section },
      async () => {
        return await supabase
          .from('sections')
          .select('title, description')
          .eq('project_id', projectId)
          .eq('key', section)
          .single();
      }
    );

    if (sectionError) {
      console.error('Error fetching section:', sectionError);
      throw new Error('Secção não encontrada');
    }

    // Search for relevant documents using RAG
    const searchQuery = `${sectionData.title} ${sectionData.description || ''}`;
    const relevantChunks = await trackSpan(
      'search-documents',
      'rag.search',
      { projectId, query: searchQuery },
      async () => await searchDocuments(supabase, projectId, searchQuery, 8)
    );

    console.log(`Found ${relevantChunks.length} relevant document chunks`);

    // Prepare context from relevant documents
    let documentContext = '';
    const sources = [];

    if (relevantChunks.length > 0) {
      documentContext = '\n\nDOCUMENTAÇÃO RELEVANTE:\n';
      relevantChunks.forEach((chunk, index) => {
        documentContext += `\n[${index + 1}] ${chunk.content}\n`;
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

    // Build system context that will be cached
    // This includes project info and documents that rarely change
    const systemContext = `[CONTEXTO DO SISTEMA - Este contexto será armazenado em cache]

Você é um especialista em candidaturas ao programa Portugal 2030. Gere conteúdo profissional e técnico para candidaturas.

INFORMAÇÕES DO PROJETO:
- Título: ${project.title || 'Sem título'}
- Descrição: ${project.description || 'Sem descrição'}
- Orçamento: ${project.budget ? `${project.budget}€` : 'Não definido'}

SECÇÃO: ${sectionData.title}
Descrição da Secção: ${sectionData.description || 'Sem descrição'}
Limite de Caracteres: ${charLimit || 2000} caracteres

${documentContext}

INSTRUÇÕES:
- Escreva em português formal de Portugal (PT-PT)
- Use linguagem técnica mas acessível
- Seja específico e concreto, evitando generalidades
- Use dados e informações dos documentos sempre que disponível
- Mantenha-se dentro do limite de caracteres
- Foque em inovação, impacto e viabilidade
- Use terminologia apropriada ao contexto Portugal 2030
- Evite repetições e frases genéricas`;

    // User prompt (this changes frequently, so not cached)
    const userPrompt = customPrompt || `Por favor, gere conteúdo profissional para a secção "${sectionData.title}".

Certifique-se de:
1. Respeitar o limite de ${charLimit || 2000} caracteres
2. Utilizar informação relevante dos documentos fornecidos
3. Manter um tom profissional e técnico
4. Destacar os aspectos de inovação e impacto do projeto

Gere o conteúdo agora:`;

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey });

    // Create messages with prompt caching
    // The system context will be cached, reducing costs on subsequent requests
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: systemContext,
            cache_control: { type: 'ephemeral' } // ← CACHE THIS CONTEXT (5 min TTL)
          },
          {
            type: 'text',
            text: userPrompt
          }
        ]
      }
    ];

    // Generate content with Claude
    console.log(`Generating with model: ${model || 'claude-3-5-sonnet-20241022'}`);

    const response = await trackSpan(
      'claude-generate',
      'ai.generate',
      { model: model || 'claude-3-5-sonnet-20241022', charLimit },
      async () => {
        return await anthropic.messages.create({
          model: model || 'claude-3-5-sonnet-20241022',
          max_tokens: Math.min(Math.ceil((charLimit || 2000) * 1.5), 8000),
          temperature: 0.7,
          messages,
        });
      }
    );

    // Extract generated text
    let generatedText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        generatedText += block.text;
      }
    }

    // Enforce character limit
    if (charLimit && generatedText.length > charLimit) {
      console.log(`Truncating text from ${generatedText.length} to ${charLimit} characters`);
      generatedText = generatedText.substring(0, charLimit);

      // Try to end at a sentence boundary
      const lastPeriod = generatedText.lastIndexOf('.');
      const lastExclamation = generatedText.lastIndexOf('!');
      const lastQuestion = generatedText.lastIndexOf('?');
      const lastSentence = Math.max(lastPeriod, lastExclamation, lastQuestion);

      if (lastSentence > charLimit * 0.8) {
        generatedText = generatedText.substring(0, lastSentence + 1);
      }
    }

    // Calculate costs
    const usage = response.usage;
    const estimatedCost = calculateCost({
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
      cache_creation_input_tokens: usage.cache_creation_input_tokens,
      cache_read_input_tokens: usage.cache_read_input_tokens
    });

    // Log generation to database for tracking
    await trackSpan(
      'log-generation',
      'db.insert',
      { projectId, section },
      async () => {
        return await supabase.from('generations').insert({
          project_id: projectId,
          section_key: section,
          model: model || 'claude-3-5-sonnet-20241022',
          provider: 'claude',
          chars_used: generatedText.length,
          chunks_used: relevantChunks.length,
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens,
          cached_tokens: usage.cache_read_input_tokens || 0,
          cache_creation_tokens: usage.cache_creation_input_tokens || 0,
          estimated_cost: estimatedCost
        });
      }
    );

    // Log cache performance
    const cacheHitRate = usage.cache_read_input_tokens
      ? (usage.cache_read_input_tokens / (usage.input_tokens + usage.cache_read_input_tokens) * 100).toFixed(1)
      : 0;

    console.log('Claude generation completed:', {
      charsUsed: generatedText.length,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cachedTokens: usage.cache_read_input_tokens || 0,
      cacheCreationTokens: usage.cache_creation_input_tokens || 0,
      cacheHitRate: `${cacheHitRate}%`,
      estimatedCost: `$${estimatedCost.toFixed(6)}`
    });

    // Return successful response
    return new Response(JSON.stringify({
      success: true,
      text: generatedText,
      charsUsed: generatedText.length,
      model: model || 'claude-3-5-sonnet-20241022',
      provider: 'claude',
      sources: sources,
      chunksUsed: relevantChunks.length,
      searchMethod: relevantChunks.length > 0 ? 'vector' : 'none',
      usage: {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        cachedTokens: usage.cache_read_input_tokens || 0,
        cacheCreationTokens: usage.cache_creation_input_tokens || 0,
        cacheHitRate: `${cacheHitRate}%`,
        estimatedCost: estimatedCost
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in generate-claude function:', error);

    // Return error response
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido na geração',
      details: error.stack,
      provider: 'claude'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}));
