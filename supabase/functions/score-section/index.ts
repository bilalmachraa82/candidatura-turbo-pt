/**
 * Supabase Edge Function: score-section
 *
 * Purpose: Analyze PT2030 section content and provide quality scores with actionable suggestions
 *
 * Uses Gemini 2.0 Flash for AI-powered content analysis
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0';
import { withSentry, trackSpan } from '../_shared/sentry.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QualityScore {
  overall: number; // 0-100
  breakdown: {
    completeness: number;    // 0-100
    specificity: number;     // 0-100
    keywords: number;        // 0-100
    structure: number;       // 0-100
    compliance: number;      // 0-100
  };
  issues: Array<{
    severity: 'critical' | 'warning' | 'suggestion';
    category: string;
    message: string;
    suggestion: string;
  }>;
  strengths: string[];
  suggestions: string[];
}

// Calculate basic metrics
function calculateBasicMetrics(content: string, charLimit: number) {
  const charCount = content.length;
  const charUsagePercent = (charCount / charLimit) * 100;

  // Split into paragraphs
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;
  const avgParagraphLength = paragraphs.length > 0
    ? paragraphs.reduce((sum, p) => sum + p.length, 0) / paragraphs.length
    : 0;

  // Check for numbers, percentages, dates
  const hasNumbers = /\d+/.test(content);
  const hasPercentages = /%/.test(content);
  const hasYears = /20\d{2}/.test(content);

  // Check for generic language
  const genericPhrases = ['muito bom', 'muito boa', 'vários', 'muitos', 'diversos'];
  const hasGenericLanguage = genericPhrases.some(phrase =>
    content.toLowerCase().includes(phrase)
  );

  // PT2030 keywords
  const pt2030Keywords = [
    'inovação', 'sustentabilidade', 'competitividade', 'digital', 'transição',
    'descarbonização', 'economia circular', 'I&D', 'investigação', 'desenvolvimento',
    'coesão territorial', 'emprego', 'qualificação'
  ];
  const keywordMatches = pt2030Keywords.filter(keyword =>
    content.toLowerCase().includes(keyword.toLowerCase())
  ).length;

  return {
    charCount,
    charUsagePercent,
    paragraphCount,
    avgParagraphLength,
    hasNumbers,
    hasPercentages,
    hasYears,
    hasGenericLanguage,
    keywordMatches,
  };
}

serve(withSentry(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Score section function called');

    // Parse request
    const { sectionId, content } = await req.json();

    if (!sectionId || !content) {
      throw new Error('sectionId e content são obrigatórios');
    }

    if (content.length < 100) {
      throw new Error('Conteúdo muito curto para análise (mínimo 100 caracteres)');
    }

    console.log('Processing score request:', { sectionId, contentLength: content.length });

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

    // Fetch section information
    const { data: sectionData, error: sectionError } = await trackSpan(
      'fetch-section',
      'db.query',
      { sectionId },
      async () => {
        return await supabase
          .from('sections')
          .select('title, description, key, char_limit, project_id')
          .eq('id', sectionId)
          .single();
      }
    );

    if (sectionError) {
      console.error('Error fetching section:', sectionError);
      throw new Error('Secção não encontrada');
    }

    const charLimit = sectionData.char_limit || 2000;

    // Calculate basic metrics
    const metrics = calculateBasicMetrics(content, charLimit);

    // Build the prompt for Gemini
    const prompt = `Você é um especialista em avaliação de candidaturas ao programa Portugal 2030.

Analise o seguinte conteúdo e forneça uma avaliação detalhada em formato JSON.

SECÇÃO: ${sectionData.title}
REQUISITOS: ${sectionData.description || 'N/A'}
LIMITE DE CARACTERES: ${charLimit}
CARACTERES UTILIZADOS: ${metrics.charCount} (${metrics.charUsagePercent.toFixed(1)}%)

CONTEÚDO:
"""
${content}
"""

MÉTRICAS BÁSICAS:
- Parágrafos: ${metrics.paragraphCount}
- Comprimento médio de parágrafo: ${Math.round(metrics.avgParagraphLength)} caracteres
- Contém números: ${metrics.hasNumbers ? 'Sim' : 'Não'}
- Contém percentagens: ${metrics.hasPercentages ? 'Sim' : 'Não'}
- Contém datas/anos: ${metrics.hasYears ? 'Sim' : 'Não'}
- Palavras-chave PT2030: ${metrics.keywordMatches}
- Linguagem genérica: ${metrics.hasGenericLanguage ? 'Sim' : 'Não'}

CRITÉRIOS DE AVALIAÇÃO:

1. **Completude** (25%):
   - Extensão apropriada (70-95% do limite é ideal)
   - Tem introdução, corpo e conclusão
   - Aborda todos os aspectos necessários

2. **Especificidade** (25%):
   - Usa números, percentagens, datas concretas
   - Evita linguagem genérica ("muito bom", "vários", "diversos")
   - Inclui exemplos concretos e mensuráveis

3. **Palavras-chave** (20%):
   - Usa terminologia PT2030 (inovação, sustentabilidade, etc.)
   - Usa vocabulário técnico apropriado ao sector
   - Alinhamento com objetivos do programa

4. **Estrutura** (15%):
   - 3-5 parágrafos é ideal
   - Parágrafos com 100-200 palavras
   - Fluxo lógico e coerente
   - Boa formatação e organização

5. **Conformidade** (15%):
   - Cumpre requisitos específicos da secção
   - Tom formal e profissional
   - Sem erros graves
   - Adequado ao contexto PT2030

RESPONDA EM JSON com esta estrutura EXATA:
{
  "overall": <número 0-100>,
  "breakdown": {
    "completeness": <número 0-100>,
    "specificity": <número 0-100>,
    "keywords": <número 0-100>,
    "structure": <número 0-100>,
    "compliance": <número 0-100>
  },
  "issues": [
    {
      "severity": "critical|warning|suggestion",
      "category": "completeness|specificity|keywords|structure|compliance",
      "message": "Descrição curta do problema",
      "suggestion": "Sugestão específica e acionável"
    }
  ],
  "strengths": [
    "Ponto forte 1",
    "Ponto forte 2"
  ],
  "suggestions": [
    "Sugestão de melhoria 1",
    "Sugestão de melhoria 2"
  ]
}

IMPORTANTE:
- Seja específico e construtivo
- Forneça sugestões acionáveis, não vagas
- Identifique 2-5 issues reais
- Destaque 2-4 pontos fortes
- Dê 2-4 sugestões de melhoria
- Use português de Portugal
- Retorne APENAS o JSON, sem texto adicional`;

    // Initialize Google Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent scoring
        maxOutputTokens: 2000,
      },
    });

    // Generate score with Gemini
    console.log('Generating quality score with Gemini...');

    const result = await trackSpan(
      'gemini-score',
      'ai.score',
      { sectionId, contentLength: content.length },
      async () => {
        return await geminiModel.generateContent(prompt);
      }
    );

    const response = await result.response;
    let scoreText = response.text();

    // Clean up the response (remove markdown code blocks if present)
    scoreText = scoreText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the JSON response
    let qualityScore: QualityScore;
    try {
      qualityScore = JSON.parse(scoreText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', scoreText);
      throw new Error('Erro ao processar resposta da IA');
    }

    // Validate and normalize scores
    qualityScore.overall = Math.max(0, Math.min(100, qualityScore.overall));
    Object.keys(qualityScore.breakdown).forEach(key => {
      qualityScore.breakdown[key as keyof typeof qualityScore.breakdown] = Math.max(
        0,
        Math.min(100, qualityScore.breakdown[key as keyof typeof qualityScore.breakdown])
      );
    });

    // Save score to database
    await trackSpan(
      'save-score',
      'db.update',
      { sectionId },
      async () => {
        return await supabase
          .from('sections')
          .update({
            quality_score: qualityScore.overall,
            quality_data: qualityScore,
            last_scored_at: new Date().toISOString(),
          })
          .eq('id', sectionId);
      }
    );

    console.log('Quality score calculated successfully:', qualityScore.overall);

    // Return successful response
    return new Response(JSON.stringify({
      success: true,
      score: qualityScore,
      metrics: metrics,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error in score-section function:', error);

    // Return error response
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido na avaliação',
      details: error.stack,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}));
