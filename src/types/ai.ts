
export type AIModel = 
  // OpenRouter Models 2025 - Premium
  | 'anthropic/claude-3.5-sonnet-20241022'
  | 'google/gemini-2.5-pro'
  | 'openai/gpt-4o'
  // OpenRouter Models 2025 - Rápido & Eficaz
  | 'google/gemini-2.5-flash'
  | 'google/gemini-2.0-flash-thinking-exp'
  | 'anthropic/claude-3.5-sonnet'
  // OpenRouter Models 2025 - Económico
  | 'qwen/qwen-2.5-72b-instruct'
  | 'meta-llama/llama-3.3-70b-instruct'
  | 'google/gemini-2.0-flash-exp'
  // OpenRouter Models - Casos Especiais
  | 'openai/o1-mini'
  | 'anthropic/claude-3-opus'
  // Flowise (legacy)
  | 'gpt-4o' 
  | 'claude-3-opus' 
  | 'gemini-pro';

export interface ModelProvider {
  provider: 'openrouter' | 'flowise';
  id: string;
  label: string;
  group: string;
  specialty?: string;
  cost?: string;
}

export interface Source {
  id: string;
  name: string;
  reference: string;
  type: 'pdf' | 'excel' | 'document';
}

export interface GenerationResult {
  text: string;
  charsUsed: number;
  sources: Source[];
  provider?: string;
  model?: string;
}

export interface HybridGenerationOptions {
  projectId: string;
  section: string;
  charLimit: number;
  provider: 'openrouter' | 'flowise';
  model: string;
}

// Helper para obter modelo recomendado por secção
export const getSectionRecommendedModel = (sectionKey: string): { provider: string; id: string } => {
  const recommendations: Record<string, string> = {
    'analise_mercado': 'google/gemini-2.5-pro',
    'proposta_valor': 'anthropic/claude-3.5-sonnet-20241022',
    'plano_financeiro': 'openai/gpt-4o',
    'estrategia_comercial': 'google/gemini-2.5-flash',
    'inovacao_tecnologica': 'anthropic/claude-3.5-sonnet-20241022',
    'sustentabilidade': 'google/gemini-2.5-pro',
    'recursos_humanos': 'google/gemini-2.5-flash',
    'cronograma': 'qwen/qwen-2.5-72b-instruct',
    'default': 'google/gemini-2.5-flash'
  };

  const modelId = recommendations[sectionKey] || recommendations.default;
  return {
    provider: 'openrouter',
    id: modelId
  };
};
