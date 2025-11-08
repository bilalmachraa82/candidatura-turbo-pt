# Migration Templates: OpenRouter → Direct SDKs
## Ready-to-Use Code for PT2030 Candidaturas

---

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Gemini Edge Function (Complete)](#gemini-edge-function-complete)
3. [Claude Edge Function (Complete)](#claude-edge-function-complete)
4. [Frontend Updates](#frontend-updates)
5. [Intelligent Model Router](#intelligent-model-router)
6. [Cost Tracking](#cost-tracking)
7. [Testing Suite](#testing-suite)

---

## Environment Setup

### 1. Get API Keys

**Google Gemini:**
```bash
# Visit: https://aistudio.google.com/app/apikey
# Click "Create API Key"
# Copy: AIza...
```

**Anthropic Claude:**
```bash
# Visit: https://console.anthropic.com/settings/keys
# Click "Create Key"
# Copy: sk-ant-api03-...
```

### 2. Configure Supabase Secrets

```bash
# Set secrets for edge functions
supabase secrets set GOOGLE_AI_API_KEY=AIza...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-...

# Keep for embeddings
supabase secrets set OPENAI_API_KEY=sk-...

# Verify
supabase secrets list
```

### 3. Update Local Environment

```bash
# .env.local
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Frontend doesn't need AI keys (only edge functions do)
```

---

## Gemini Edge Function (Complete)

### File: `supabase/functions/generate-gemini/index.ts`

```typescript
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  projectId: string;
  section: string;
  charLimit?: number;
  customPrompt?: string;
  stream?: boolean;
  model?: string;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      projectId,
      section,
      charLimit = 2000,
      customPrompt,
      stream = false,
      model = 'gemini-2.0-flash',
    } = (await req.json()) as GenerateRequest;

    console.log('[Gemini] Request:', { projectId, section, charLimit, model, stream });

    // Validate input
    if (!projectId || !section) {
      throw new Error('projectId e section são obrigatórios');
    }

    // Initialize Gemini
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY não configurada');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: Math.min(Math.floor(charLimit * 1.5), 8000),
        topP: 0.95,
        topK: 40,
      },
    });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase não configurado');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get section metadata
    const { data: sectionData, error: sectionError } = await supabase
      .from('sections')
      .select('title, description, content')
      .eq('project_id', projectId)
      .eq('key', section)
      .single();

    if (sectionError) {
      console.error('[Gemini] Section error:', sectionError);
      throw new Error(`Secção não encontrada: ${section}`);
    }

    console.log('[Gemini] Section loaded:', sectionData.title);

    // RAG: Search for relevant documents
    let ragContext = '';
    let sources: any[] = [];

    try {
      const searchQuery = `${sectionData.title} ${sectionData.description || ''}`;
      const queryEmbedding = await generateEmbedding(genAI, searchQuery);

      const { data: chunks, error: ragError } = await supabase.rpc(
        'match_document_chunks',
        {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          match_threshold: 0.65,
          match_count: 6,
          p_project_id: projectId,
        }
      );

      if (ragError) {
        console.warn('[Gemini] RAG error (continuing without):', ragError);
      } else if (chunks && chunks.length > 0) {
        console.log(`[Gemini] Found ${chunks.length} relevant chunks`);

        ragContext = '\n\nDOCUMENTAÇÃO RELEVANTE DO PROJETO:\n\n';
        chunks.forEach((chunk: any, i: number) => {
          const source = chunk.metadata?.source || 'Documento';
          ragContext += `[Fonte ${i + 1}: ${source}]\n${chunk.content}\n\n`;

          sources.push({
            id: chunk.id,
            name: source,
            excerpt: chunk.content.substring(0, 150) + '...',
            confidence: chunk.similarity || 0,
          });
        });
      }
    } catch (ragErr) {
      console.warn('[Gemini] RAG failed, continuing without context:', ragErr);
    }

    // Build prompt
    const systemContext = `Você é um especialista em candidaturas ao programa Portugal 2030.

INSTRUÇÕES:
- Gere conteúdo profissional e técnico adequado para candidaturas oficiais
- Use linguagem formal mas acessível
- Seja específico e concreto, evitando generalidades
- Cite documentação fornecida quando relevante
- Foque em resultados mensuráveis e impacto
- Mantenha tom profissional e técnico`;

    const userPrompt = customPrompt || `
TAREFA: Gerar conteúdo para a secção "${sectionData.title}"

DESCRIÇÃO DA SECÇÃO:
${sectionData.description || 'Sem descrição disponível'}

${sectionData.content ? `CONTEÚDO ATUAL (use como referência):\n${sectionData.content}\n` : ''}

REQUISITOS:
- Máximo de ${charLimit} caracteres
- Foque nos aspectos mais relevantes para aprovação da candidatura
- Use informação da documentação quando disponível
${ragContext}

Gere o conteúdo para a secção "${sectionData.title}":`;

    const fullPrompt = `${systemContext}\n\n${userPrompt}`;

    // Generate content
    if (stream) {
      // STREAMING MODE
      const result = await geminiModel.generateContentStream(fullPrompt);

      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            let fullText = '';

            for await (const chunk of result.stream) {
              const text = chunk.text();
              fullText += text;

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'content',
                    text,
                    fullText,
                    sources: sources.length > 0 ? sources : undefined,
                  })}\n\n`
                )
              );
            }

            // Log generation
            await supabase.from('generations').insert({
              project_id: projectId,
              section_key: section,
              model,
            });

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'done',
                  fullText,
                  charsUsed: fullText.length,
                  sources,
                })}\n\n`
              )
            );
            controller.close();
          } catch (error) {
            console.error('[Gemini] Stream error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      // NON-STREAMING MODE
      const result = await geminiModel.generateContent(fullPrompt);
      const text = result.response.text();

      console.log(`[Gemini] Generated ${text.length} chars`);

      // Log generation
      await supabase.from('generations').insert({
        project_id: projectId,
        section_key: section,
        model,
      });

      return new Response(
        JSON.stringify({
          success: true,
          text,
          charsUsed: text.length,
          sources,
          model,
          provider: 'google',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    console.error('[Gemini] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido',
        details: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper: Generate embeddings using Gemini
async function generateEmbedding(
  genAI: GoogleGenerativeAI,
  text: string
): Promise<number[]> {
  const embeddingModel = genAI.getGenerativeModel({
    model: 'text-embedding-004',
  });

  const result = await embeddingModel.embedContent(text);
  return result.embedding.values;
}
```

### Deploy Gemini Function

```bash
# Deploy
supabase functions deploy generate-gemini

# Test locally
supabase functions serve generate-gemini

# Test with curl
curl -X POST https://xxxxx.supabase.co/functions/v1/generate-gemini \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-uuid",
    "section": "objetivos",
    "charLimit": 500,
    "stream": false
  }'
```

---

## Claude Edge Function (Complete)

### File: `supabase/functions/generate-claude/index.ts`

```typescript
import Anthropic from 'npm:@anthropic-ai/sdk@0.34.1';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  projectId: string;
  section: string;
  charLimit?: number;
  customPrompt?: string;
  stream?: boolean;
  model?: string;
  enableCaching?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      projectId,
      section,
      charLimit = 2000,
      customPrompt,
      stream = false,
      model = 'claude-3-5-sonnet-20241022',
      enableCaching = true,
    } = (await req.json()) as GenerateRequest;

    console.log('[Claude] Request:', { projectId, section, charLimit, model, stream, enableCaching });

    // Validate
    if (!projectId || !section) {
      throw new Error('projectId e section são obrigatórios');
    }

    // Initialize Claude
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY não configurada');
    }

    const anthropic = new Anthropic({ apiKey });

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase não configurado');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get section metadata
    const { data: sectionData, error: sectionError } = await supabase
      .from('sections')
      .select('title, description, content')
      .eq('project_id', projectId)
      .eq('key', section)
      .single();

    if (sectionError) {
      console.error('[Claude] Section error:', sectionError);
      throw new Error(`Secção não encontrada: ${section}`);
    }

    console.log('[Claude] Section loaded:', sectionData.title);

    // RAG: Search documents
    let ragContext = '';
    let sources: any[] = [];

    try {
      // Generate embedding (using OpenAI for compatibility)
      const searchQuery = `${sectionData.title} ${sectionData.description || ''}`;
      const queryEmbedding = await generateOpenAIEmbedding(searchQuery);

      const { data: chunks, error: ragError } = await supabase.rpc(
        'match_document_chunks',
        {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          match_threshold: 0.7,
          match_count: 8,
          p_project_id: projectId,
        }
      );

      if (ragError) {
        console.warn('[Claude] RAG error:', ragError);
      } else if (chunks && chunks.length > 0) {
        console.log(`[Claude] Found ${chunks.length} relevant chunks`);

        // Build RAG context (CACHEABLE)
        ragContext = '# DOCUMENTAÇÃO DO PROJETO\n\n';
        ragContext += 'Use a documentação abaixo como referência para gerar conteúdo preciso e contextualizado.\n\n';

        chunks.forEach((chunk: any, i: number) => {
          const source = chunk.metadata?.source || 'Documento';
          const page = chunk.metadata?.page || '?';

          ragContext += `## Documento ${i + 1}: ${source} (pág. ${page})\n\n`;
          ragContext += `${chunk.content}\n\n`;
          ragContext += `---\n\n`;

          sources.push({
            id: chunk.id,
            name: source,
            page,
            excerpt: chunk.content.substring(0, 200) + '...',
            confidence: chunk.similarity || 0,
          });
        });
      }
    } catch (ragErr) {
      console.warn('[Claude] RAG failed:', ragErr);
    }

    // System prompt (CACHEABLE)
    const systemPrompt = `Você é um especialista sénior em candidaturas ao programa Portugal 2030, com experiência em redação técnica e jurídica.

# INSTRUÇÕES GERAIS

## Tom e Estilo
- Use linguagem formal, precisa e profissional
- Mantenha tom técnico mas acessível
- Evite jargão desnecessário
- Seja objetivo e direto

## Conteúdo
- Foque em resultados mensuráveis e KPIs
- Destaque impacto económico, social e ambiental
- Cite legislação e documentação relevante quando apropriado
- Use dados concretos da documentação fornecida

## Estrutura
- Organize informação de forma lógica
- Use parágrafos curtos e concisos
- Destaque pontos-chave
- Mantenha coerência com outras secções

## Qualidade
- Revise ortografia e gramática
- Mantenha consistência terminológica
- Assegure clareza e precisão
- Respeite limites de caracteres`;

    // User message content
    const userContent: Anthropic.MessageParam['content'] = [];

    // Add RAG context (CACHEABLE if enabled)
    if (ragContext) {
      userContent.push({
        type: 'text',
        text: ragContext,
        ...(enableCaching && {
          cache_control: { type: 'ephemeral' as const },
        }),
      });
    }

    // Add task description (NOT CACHED)
    const taskPrompt = customPrompt || `
# TAREFA

Gere conteúdo profissional para a seguinte secção da candidatura:

**Secção:** ${sectionData.title}

**Descrição:** ${sectionData.description || 'Sem descrição'}

${sectionData.content ? `**Conteúdo atual (use como referência):**\n${sectionData.content}\n` : ''}

**Requisitos:**
- Máximo de ${charLimit} caracteres
- Foque nos aspectos críticos para aprovação
- Use documentação do projeto quando relevante
- Mantenha tom formal e profissional

Gere o conteúdo agora:`;

    userContent.push({
      type: 'text',
      text: taskPrompt,
    });

    // Prepare messages
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: userContent,
      },
    ];

    // Prepare system
    const systemBlocks: Anthropic.TextBlock[] = [
      {
        type: 'text',
        text: systemPrompt,
        ...(enableCaching && {
          cache_control: { type: 'ephemeral' as const },
        }),
      },
    ];

    if (stream) {
      // STREAMING MODE
      const streamResponse = await anthropic.messages.stream({
        model,
        max_tokens: Math.min(Math.floor(charLimit * 2), 4096),
        temperature: 0.7,
        system: systemBlocks,
        messages,
      });

      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            let fullText = '';
            let usage: any = null;

            for await (const event of streamResponse) {
              if (event.type === 'content_block_delta') {
                const delta = event.delta;
                if (delta.type === 'text_delta') {
                  const text = delta.text;
                  fullText += text;

                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({
                        type: 'content',
                        text,
                        fullText,
                      })}\n\n`
                    )
                  );
                }
              } else if (event.type === 'message_stop') {
                const finalMessage = await streamResponse.finalMessage();
                usage = finalMessage.usage;
              }
            }

            // Log generation
            await supabase.from('generations').insert({
              project_id: projectId,
              section_key: section,
              model,
            });

            // Send completion
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'done',
                  fullText,
                  charsUsed: fullText.length,
                  sources,
                  cacheStats: usage ? {
                    inputTokens: usage.input_tokens,
                    outputTokens: usage.output_tokens,
                    cacheCreationTokens: usage.cache_creation_input_tokens || 0,
                    cacheReadTokens: usage.cache_read_input_tokens || 0,
                  } : undefined,
                })}\n\n`
              )
            );

            controller.close();
          } catch (error) {
            console.error('[Claude] Stream error:', error);
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      // NON-STREAMING MODE
      const response = await anthropic.messages.create({
        model,
        max_tokens: Math.min(Math.floor(charLimit * 2), 4096),
        temperature: 0.7,
        system: systemBlocks,
        messages,
      });

      const text =
        response.content[0].type === 'text' ? response.content[0].text : '';

      // Cache statistics
      const cacheStats = {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        cacheCreationTokens: response.usage.cache_creation_input_tokens || 0,
        cacheReadTokens: response.usage.cache_read_input_tokens || 0,
      };

      const cacheHitRate = cacheStats.cacheCreationTokens > 0
        ? (cacheStats.cacheReadTokens / (cacheStats.cacheCreationTokens + cacheStats.cacheReadTokens)) * 100
        : 0;

      console.log(`[Claude] Generated ${text.length} chars`);
      console.log(`[Claude] Cache stats:`, cacheStats);
      console.log(`[Claude] Cache hit rate: ${cacheHitRate.toFixed(1)}%`);

      // Log generation
      await supabase.from('generations').insert({
        project_id: projectId,
        section_key: section,
        model,
      });

      return new Response(
        JSON.stringify({
          success: true,
          text,
          charsUsed: text.length,
          sources,
          model,
          provider: 'anthropic',
          cacheStats,
          cacheHitRate: `${cacheHitRate.toFixed(1)}%`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    console.error('[Claude] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido',
        details: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper: Generate embeddings using OpenAI
async function generateOpenAIEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-3-small',
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embeddings failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
```

### Deploy Claude Function

```bash
# Deploy
supabase functions deploy generate-claude

# Test
curl -X POST https://xxxxx.supabase.co/functions/v1/generate-claude \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "test-uuid",
    "section": "objetivos",
    "charLimit": 500,
    "stream": false,
    "enableCaching": true
  }'
```

---

## Frontend Updates

### 1. Update Model Selector

File: `src/components/ModelSelector.tsx`

```typescript
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ModelConfig {
  provider: 'google' | 'anthropic' | 'openrouter';
  id: string;
  name: string;
  description: string;
  badge: string;
  endpoint: string; // ← NEW
  costLevel: 'free' | 'low' | 'medium' | 'high';
  qualityLevel: 'good' | 'excellent' | 'best';
}

export const AI_MODELS: ModelConfig[] = [
  // RECOMMENDED
  {
    provider: 'google',
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    description: 'Rápido e eficiente - Recomendado para uso geral',
    badge: 'Recomendado',
    endpoint: 'generate-gemini',
    costLevel: 'low',
    qualityLevel: 'excellent',
  },
  {
    provider: 'anthropic',
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    description: 'Qualidade superior - Ideal para secções críticas',
    badge: 'Premium',
    endpoint: 'generate-claude',
    costLevel: 'high',
    qualityLevel: 'best',
  },

  // ALTERNATIVES
  {
    provider: 'google',
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Avançado com raciocínio - Para análises complexas',
    badge: 'Avançado',
    endpoint: 'generate-gemini',
    costLevel: 'medium',
    qualityLevel: 'excellent',
  },

  // FALLBACK (OpenRouter)
  {
    provider: 'openrouter',
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    description: 'Alternativa económica',
    badge: 'Económico',
    endpoint: 'generate-openrouter',
    costLevel: 'low',
    qualityLevel: 'good',
  },
];

interface ModelSelectorProps {
  value: ModelConfig;
  onChange: (model: ModelConfig) => void;
  disabled?: boolean;
  recommendedFor?: string; // section key
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  recommendedFor,
}) => {
  // Get recommended model for section
  const recommended = recommendedFor
    ? getRecommendedModelForSection(recommendedFor)
    : null;

  const getBadgeVariant = (badge: string) => {
    switch (badge) {
      case 'Recomendado':
        return 'default';
      case 'Premium':
        return 'secondary';
      case 'Avançado':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getCostBadge = (level: string) => {
    const badges = {
      free: { text: 'Grátis', color: 'bg-green-500' },
      low: { text: '$', color: 'bg-blue-500' },
      medium: { text: '$$', color: 'bg-yellow-500' },
      high: { text: '$$$', color: 'bg-red-500' },
    };
    return badges[level] || badges.low;
  };

  return (
    <div className="space-y-2">
      <Select
        value={`${value.provider}:${value.id}`}
        onValueChange={(modelKey) => {
          const model = AI_MODELS.find(
            (m) => `${m.provider}:${m.id}` === modelKey
          );
          if (model) onChange(model);
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span className="truncate">{value.name}</span>
              <Badge variant={getBadgeVariant(value.badge)} className="text-xs">
                {value.badge}
              </Badge>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-96">
          {AI_MODELS.map((model) => {
            const isRecommended = recommended?.id === model.id;
            const cost = getCostBadge(model.costLevel);

            return (
              <SelectItem
                key={`${model.provider}:${model.id}`}
                value={`${model.provider}:${model.id}`}
                className="p-3"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    {isRecommended && (
                      <Badge variant="default" className="text-xs">
                        ⭐ Recomendado
                      </Badge>
                    )}
                    <Badge variant={getBadgeVariant(model.badge)} className="text-xs">
                      {model.badge}
                    </Badge>
                    <div
                      className={`${cost.color} text-white text-xs px-1.5 py-0.5 rounded`}
                    >
                      {cost.text}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {model.description}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {recommended && recommended.id !== value.id && (
        <div className="text-xs text-yellow-600 flex items-center gap-1">
          <span>💡</span>
          <span>
            Sugestão: {recommended.name} é recomendado para esta secção
          </span>
        </div>
      )}
    </div>
  );
};

// Section → Model recommendations
function getRecommendedModelForSection(sectionKey: string): ModelConfig | null {
  const criticalSections = [
    'objetivos',
    'impacto',
    'resultados',
    'sustentabilidade',
    'inovacao',
  ];

  if (criticalSections.includes(sectionKey)) {
    // Critical sections → Claude
    return AI_MODELS.find((m) => m.id === 'claude-3-5-sonnet-20241022') || null;
  } else {
    // Standard sections → Gemini
    return AI_MODELS.find((m) => m.id === 'gemini-2.0-flash') || null;
  }
}

export default ModelSelector;
export { getRecommendedModelForSection };
export type { ModelConfig };
```

---

## Intelligent Model Router

### File: `src/lib/intelligentRouter.ts`

```typescript
import { AI_MODELS, ModelConfig } from '@/components/ModelSelector';

interface RouterContext {
  sectionKey: string;
  charLimit: number;
  hasDocuments: boolean;
  userPreference?: 'fast' | 'quality' | 'balanced';
  budget?: 'low' | 'medium' | 'high';
}

/**
 * Intelligently select the best model for a given context
 */
export function selectOptimalModel(context: RouterContext): ModelConfig {
  const {
    sectionKey,
    charLimit,
    hasDocuments,
    userPreference = 'balanced',
    budget = 'medium',
  } = context;

  // Critical sections that need best quality
  const criticalSections = [
    'objetivos',
    'impacto',
    'resultados_esperados',
    'sustentabilidade',
    'inovacao',
    'justificacao',
  ];

  // Simple sections that can use faster models
  const simpleSections = [
    'descricao_breve',
    'localizacao',
    'contactos',
    'cronograma',
  ];

  // User wants maximum quality
  if (userPreference === 'quality') {
    return AI_MODELS.find((m) => m.id === 'claude-3-5-sonnet-20241022')!;
  }

  // User wants maximum speed
  if (userPreference === 'fast') {
    return AI_MODELS.find((m) => m.id === 'gemini-2.0-flash')!;
  }

  // Budget constraints
  if (budget === 'low') {
    return AI_MODELS.find((m) => m.id === 'gemini-2.0-flash')!;
  }

  // Balanced approach (default)
  if (criticalSections.includes(sectionKey)) {
    // Critical section with RAG context → Claude (best for Portuguese quality)
    if (hasDocuments) {
      return AI_MODELS.find((m) => m.id === 'claude-3-5-sonnet-20241022')!;
    }
    // Critical but no context → Still Claude for quality
    return AI_MODELS.find((m) => m.id === 'claude-3-5-sonnet-20241022')!;
  }

  if (simpleSections.includes(sectionKey)) {
    // Simple section → Gemini (fast and cheap)
    return AI_MODELS.find((m) => m.id === 'gemini-2.0-flash')!;
  }

  // Long content → Gemini (better price)
  if (charLimit > 3000) {
    return AI_MODELS.find((m) => m.id === 'gemini-2.0-flash')!;
  }

  // Medium sections with documents → Claude
  if (hasDocuments) {
    return AI_MODELS.find((m) => m.id === 'claude-3-5-sonnet-20241022')!;
  }

  // Default: Gemini for most cases
  return AI_MODELS.find((m) => m.id === 'gemini-2.0-flash')!;
}

/**
 * Estimate cost for a generation
 */
export function estimateCost(
  model: ModelConfig,
  inputTokens: number,
  outputTokens: number,
  cacheHits: boolean = false
): number {
  const pricing = {
    'gemini-2.0-flash': { input: 0.10, output: 0.40 },
    'gemini-2.5-flash': { input: 0.30, output: 2.50 },
    'claude-3-5-sonnet-20241022': {
      input: 3.0,
      output: 15.0,
      cacheWrite: 3.75,
      cacheRead: 0.30,
    },
  };

  const prices = pricing[model.id];
  if (!prices) return 0;

  let cost = 0;

  if (model.provider === 'anthropic' && cacheHits) {
    // Use cached pricing
    cost += (inputTokens / 1_000_000) * prices.cacheRead!;
  } else {
    cost += (inputTokens / 1_000_000) * prices.input;
  }

  cost += (outputTokens / 1_000_000) * prices.output;

  return cost;
}
```

---

## Cost Tracking

### Database Migration

Create: `supabase/migrations/20250120000010_add_cost_tracking.sql`

```sql
-- Add cost tracking to generations table
ALTER TABLE generations
ADD COLUMN IF NOT EXISTS input_tokens INTEGER,
ADD COLUMN IF NOT EXISTS output_tokens INTEGER,
ADD COLUMN IF NOT EXISTS cache_read_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cache_write_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10, 6);

-- Create cost analytics view
CREATE OR REPLACE VIEW generation_costs AS
SELECT
  DATE_TRUNC('day', timestamp) as date,
  model,
  COUNT(*) as generations,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cache_read_tokens) as total_cache_read_tokens,
  SUM(estimated_cost) as total_cost
FROM generations
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), model
ORDER BY date DESC, total_cost DESC;

-- Create monthly cost summary
CREATE OR REPLACE VIEW monthly_costs AS
SELECT
  DATE_TRUNC('month', timestamp) as month,
  model,
  COUNT(*) as generations,
  SUM(estimated_cost) as total_cost
FROM generations
GROUP BY DATE_TRUNC('month', timestamp), model
ORDER BY month DESC;
```

### Frontend Cost Dashboard

File: `src/components/CostDashboard.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CostData {
  date: string;
  model: string;
  generations: number;
  total_cost: number;
}

export function CostDashboard() {
  const [costs, setCosts] = useState<CostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCosts();
  }, []);

  async function loadCosts() {
    const { data, error } = await supabase
      .from('generation_costs')
      .select('*')
      .limit(30);

    if (error) {
      console.error('Failed to load costs:', error);
    } else {
      setCosts(data || []);
    }

    setLoading(false);
  }

  const totalCost = costs.reduce((sum, row) => sum + Number(row.total_cost), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custos de IA (últimos 30 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-4">
            <div className="text-3xl font-bold">${totalCost.toFixed(2)}</div>

            <div className="space-y-2">
              {Object.entries(
                costs.reduce((acc, row) => {
                  acc[row.model] = (acc[row.model] || 0) + Number(row.total_cost);
                  return acc;
                }, {} as Record<string, number>)
              ).map(([model, cost]) => (
                <div key={model} className="flex justify-between text-sm">
                  <span>{model}</span>
                  <span className="font-mono">${cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Testing Suite

### File: `tests/ai-generation.test.ts`

```typescript
import { assertEquals, assertExists } from 'https://deno.land/std@0.192.0/testing/asserts.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.test('Gemini: Generate text for section', async () => {
  const { data, error } = await supabase.functions.invoke('generate-gemini', {
    body: {
      projectId: 'test-project-uuid',
      section: 'objetivos',
      charLimit: 500,
      stream: false,
    },
  });

  assertEquals(error, null);
  assertExists(data.text);
  assertEquals(data.success, true);
  console.log('✅ Gemini generation:', data.text.substring(0, 100));
});

Deno.test('Claude: Generate with caching', async () => {
  const { data, error } = await supabase.functions.invoke('generate-claude', {
    body: {
      projectId: 'test-project-uuid',
      section: 'objetivos',
      charLimit: 500,
      stream: false,
      enableCaching: true,
    },
  });

  assertEquals(error, null);
  assertExists(data.text);
  assertExists(data.cacheStats);
  console.log('✅ Claude generation:', data.text.substring(0, 100));
  console.log('✅ Cache stats:', data.cacheStats);
});

Deno.test('Gemini: Streaming generation', async () => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/generate-gemini`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId: 'test-project-uuid',
        section: 'objetivos',
        charLimit: 200,
        stream: true,
      }),
    }
  );

  assertEquals(response.ok, true);
  assertEquals(response.headers.get('content-type'), 'text/event-stream');

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  let chunks = 0;
  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    if (chunk.includes('data:')) {
      chunks++;
    }
  }

  console.log(`✅ Received ${chunks} streaming chunks`);
});
```

Run tests:
```bash
deno test tests/ai-generation.test.ts --allow-env --allow-net
```

---

## Deployment Checklist

```bash
# ✅ 1. Set secrets
supabase secrets set GOOGLE_AI_API_KEY=AIza...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set OPENAI_API_KEY=sk-...

# ✅ 2. Deploy functions
supabase functions deploy generate-gemini
supabase functions deploy generate-claude

# ✅ 3. Run migrations
supabase db push

# ✅ 4. Test locally
npm run dev

# ✅ 5. Deploy frontend (Railway)
railway up

# ✅ 6. Monitor costs
# Check Supabase dashboard → Functions → Invocations
# Check generation_costs view in database

# ✅ 7. Gradual rollout
# Week 1: 10% traffic to new functions
# Week 2: 50% traffic
# Week 3: 100% traffic
# Week 4: Remove OpenRouter fallback
```

---

## Next Steps

1. Copy these templates to your project
2. Replace placeholder UUIDs with real data
3. Test thoroughly in development
4. Deploy to staging
5. Monitor costs for 1 week
6. Deploy to production

Good luck with the migration! 🚀
