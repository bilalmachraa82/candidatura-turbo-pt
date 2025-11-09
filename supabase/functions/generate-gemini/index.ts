/**
 * Supabase Edge Function: generate-gemini
 *
 * Purpose: Generate AI content using Google Gemini SDK with RAG (Retrieval Augmented Generation)
 *
 * Migration Strategy: This function replaces 70% of OpenRouter calls with Gemini 2.0 Flash
 * - Use Gemini for fast, cost-effective generation
 * - Keep OpenRouter as fallback for complex requests
 *
 * Cost Information:
 * - Gemini 2.0 Flash: $0.10 per 1M input tokens, $0.40 per 1M output tokens
 * - Free tier: 15 RPM (requests per minute), 1M tokens/day
 * - Gemini 1.5 Flash: Similar pricing, stable version
 * - Gemini 1.5 Pro: Higher quality, $7/$21 per 1M tokens
 *
 * Environment Variables Required:
 * - GOOGLE_AI_API_KEY: Google AI API key (get from https://aistudio.google.com/app/apikey)
 * - OPENAI_API_KEY: For embeddings generation
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 * - SENTRY_DSN: (Optional) Sentry error tracking
 *
 * Setup:
 *   supabase secrets set GOOGLE_AI_API_KEY=AIza...
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';
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

serve(withSentry(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate Gemini function called');

    // Parse and validate request
    const { projectId, section, charLimit, model, customPrompt } = await req.json();

    if (!projectId || !section) {
      throw new Error('ProjectId e section são obrigatórios');
    }

    console.log('Processing request:', { projectId, section, charLimit, model });

    // Get Google AI API key
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY não configurada. Configure com: supabase secrets set GOOGLE_AI_API_KEY=AIza...');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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

    // Build the prompt for Gemini
    const systemPrompt = 'Você é um especialista em candidaturas ao programa Portugal 2030. Gere conteúdo profissional e técnico para candidaturas.';

    const prompt = customPrompt || `
Você é um especialista em candidaturas ao programa Portugal 2030. Gere conteúdo para a secção "${sectionData.title}" de uma candidatura.

DESCRIÇÃO DA SECÇÃO: ${sectionData.description || ''}

REQUISITOS:
- Máximo ${charLimit || 2000} caracteres
- Linguagem técnica mas acessível em português de Portugal
- Foque nos aspectos mais relevantes para a candidatura
- Use informação da documentação fornecida quando disponível
- Seja específico e concreto
- Evite repetições e frases genéricas
- Use terminologia apropriada ao contexto Portugal 2030

${context}

Gere o conteúdo para a secção "${sectionData.title}":`;

    // Initialize Google Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model: model || 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: Math.min(Math.floor((charLimit || 2000) * 1.2), 4000),
      },
    });

    // Generate content with Gemini
    console.log(`Generating with model: ${model || 'gemini-2.0-flash-exp'}`);

    const result = await trackSpan(
      'gemini-generate',
      'ai.generate',
      { model: model || 'gemini-2.0-flash-exp', charLimit },
      async () => {
        // Combine system prompt with user prompt
        const fullPrompt = `${systemPrompt}\n\n${prompt}`;
        return await geminiModel.generateContent(fullPrompt);
      }
    );

    const response = await result.response;
    let generatedText = response.text();

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

    // Log generation to database for tracking
    await trackSpan(
      'log-generation',
      'db.insert',
      { projectId, section },
      async () => {
        return await supabase.from('generations').insert({
          project_id: projectId,
          section_key: section,
          model: model || 'gemini-2.0-flash-exp',
          provider: 'gemini',
          chars_used: generatedText.length,
          chunks_used: relevantChunks.length
        });
      }
    );

    console.log('Text generation completed successfully');

    // Return successful response
    return new Response(JSON.stringify({
      success: true,
      text: generatedText,
      charsUsed: generatedText.length,
      model: model || 'gemini-2.0-flash-exp',
      provider: 'gemini',
      sources: sources,
      chunksUsed: relevantChunks.length,
      searchMethod: relevantChunks.length > 0 ? 'vector' : 'none'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in generate-gemini function:', error);

    // Return error response
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido na geração',
      details: error.stack,
      provider: 'gemini'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}));
