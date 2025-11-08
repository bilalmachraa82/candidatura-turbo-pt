/**
 * Supabase Edge Function: chat-copilot
 *
 * Purpose: AI Chat Copilot for conversational PT2030 candidatura assistance
 *
 * Features:
 * - Context-aware conversation using RAG (Retrieval Augmented Generation)
 * - Maintains conversation history
 * - Integrates with project data, sections, and documents
 * - Uses Gemini 2.0 Flash for cost-effective, fast responses
 * - Streaming support for better UX
 *
 * Environment Variables Required:
 * - GOOGLE_AI_API_KEY: Google AI API key
 * - OPENAI_API_KEY: For embeddings generation
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
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
    console.log('Chat Copilot function called');

    // Parse and validate request
    const { conversationId, message, projectId, currentSection, stream = false } = await req.json();

    if (!message || !projectId) {
      throw new Error('Message e projectId são obrigatórios');
    }

    console.log('Processing chat request:', { conversationId, projectId, currentSection, stream });

    // Get Google AI API key
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY não configurada');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autenticado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Não autenticado');
    }

    // Fetch project metadata
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('title, description')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
    }

    // Initialize or fetch conversation
    let conversation;
    if (conversationId) {
      // Fetch existing conversation
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        throw new Error('Conversa não encontrada');
      }
      conversation = data;
    } else {
      // Create new conversation
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          project_id: projectId,
          user_id: user.id,
          title: message.substring(0, 100) // Use first message as title
        })
        .select()
        .single();

      if (error) {
        throw new Error('Erro ao criar conversa');
      }
      conversation = data;
    }

    // Fetch conversation history (last 10 messages)
    const { data: history, error: historyError } = await trackSpan(
      'fetch-history',
      'db.query',
      { conversationId: conversation.id },
      async () => {
        return await supabase
          .from('chat_messages')
          .select('role, content')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true })
          .limit(10);
      }
    );

    if (historyError) {
      console.error('Error fetching history:', historyError);
    }

    // Fetch current section data if provided
    let sectionContext = '';
    if (currentSection) {
      const { data: sectionData, error: sectionError } = await supabase
        .from('sections')
        .select('title, description, content, char_limit')
        .eq('project_id', projectId)
        .eq('key', currentSection)
        .single();

      if (!sectionError && sectionData) {
        sectionContext = `\n\nSECÇÃO ATUAL: ${sectionData.title}
Descrição: ${sectionData.description || 'N/A'}
Conteúdo atual: ${sectionData.content ? sectionData.content.substring(0, 500) + '...' : 'Vazio'}
Limite de caracteres: ${sectionData.char_limit || 'N/A'}`;
      }
    }

    // Search for relevant documents using RAG
    const searchQuery = `${message} ${currentSection || ''}`;
    const relevantChunks = await trackSpan(
      'search-documents',
      'rag.search',
      { projectId, query: searchQuery },
      async () => await searchDocuments(supabase, projectId, searchQuery, 5)
    );

    console.log(`Found ${relevantChunks.length} relevant document chunks`);

    // Prepare context from relevant documents
    let documentContext = '';
    if (relevantChunks.length > 0) {
      documentContext = '\n\nDOCUMENTOS RELEVANTES:\n';
      relevantChunks.forEach((chunk, index) => {
        documentContext += `\n[${index + 1}] ${chunk.content.substring(0, 300)}...\n`;
      });
    }

    // Build the system prompt
    const systemPrompt = `Você é um assistente especializado em candidaturas ao programa Portugal 2030.

PROJETO: ${project?.title || 'N/A'}
${project?.description ? `Descrição: ${project.description}` : ''}

${sectionContext}

${documentContext}

INSTRUÇÕES:
- Responda em português de Portugal
- Seja específico e prático
- Use informação dos documentos quando relevante
- Forneça exemplos concretos
- Se o utilizador pedir ajuda com uma secção, gere conteúdo apropriado
- Seja conciso mas informativo
- Use terminologia apropriada ao contexto Portugal 2030`;

    // Build conversation history for Gemini
    const conversationHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Save user message to database
    await supabase.from('chat_messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message,
      context: {
        projectId,
        currentSection,
        documentChunks: relevantChunks.length
      }
    });

    // Initialize Google Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
      systemInstruction: systemPrompt,
    });

    // Start chat session with history
    const chat = model.startChat({
      history: conversationHistory,
    });

    // Generate response
    console.log('Generating response with Gemini');

    if (stream) {
      // Streaming response
      const result = await trackSpan(
        'gemini-chat-stream',
        'ai.chat',
        { model: 'gemini-2.0-flash-exp' },
        async () => await chat.sendMessageStream(message)
      );

      // Create readable stream
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            let fullResponse = '';

            for await (const chunk of result.stream) {
              const text = chunk.text();
              fullResponse += text;

              // Send chunk
              const data = JSON.stringify({ token: text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // Save assistant message to database
            await supabase.from('chat_messages').insert({
              conversation_id: conversation.id,
              role: 'assistant',
              content: fullResponse,
              model: 'gemini-2.0-flash-exp',
              tokens_used: Math.ceil(fullResponse.length / 4) // Rough estimate
            });

            // Send done signal
            const doneData = JSON.stringify({
              done: true,
              conversationId: conversation.id
            });
            controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
            controller.close();

          } catch (error: any) {
            console.error('Streaming error:', error);
            const errorData = JSON.stringify({ error: error.message });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(readableStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });

    } else {
      // Non-streaming response
      const result = await trackSpan(
        'gemini-chat',
        'ai.chat',
        { model: 'gemini-2.0-flash-exp' },
        async () => await chat.sendMessage(message)
      );

      const response = await result.response;
      const responseText = response.text();

      // Save assistant message to database
      await supabase.from('chat_messages').insert({
        conversation_id: conversation.id,
        role: 'assistant',
        content: responseText,
        model: 'gemini-2.0-flash-exp',
        tokens_used: Math.ceil(responseText.length / 4) // Rough estimate
      });

      console.log('Chat response generated successfully');

      return new Response(JSON.stringify({
        success: true,
        message: responseText,
        conversationId: conversation.id,
        model: 'gemini-2.0-flash-exp'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('Error in chat-copilot function:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido no chat',
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}));
