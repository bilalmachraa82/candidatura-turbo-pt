
export type AIModel = 
  // OpenRouter Models 2025 - Premium
  | 'google/gemini-2.5-pro'
  | 'anthropic/claude-3.5-sonnet'
  | 'openai/gpt-4o'
  // OpenRouter Models 2025 - Rápido & Eficaz  
  | 'google/gemini-2.0-flash-exp'
  | 'meta-llama/llama-3.2-90b-vision-instruct'
  // OpenRouter Models 2025 - Económico
  | 'qwen/qwen-2.5-72b-instruct'
  | 'meta-llama/llama-3.3-70b-instruct';

export interface ModelProvider {
  provider: 'openrouter'; // Only OpenRouter now
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
  provider: 'openrouter'; // Only OpenRouter
  model: string;
}

// Helper para obter modelo recomendado por secção - sempre OpenRouter
export const getSectionRecommendedModel = (sectionKey: string): { provider: string; id: string } => {
  const recommendations: Record<string, string> = {
    'analise_mercado': 'google/gemini-2.5-pro',
    'proposta_valor': 'anthropic/claude-3.5-sonnet',
    'plano_financeiro': 'openai/gpt-4o',
    'estrategia_comercial': 'google/gemini-2.0-flash-exp',
    'inovacao_tecnologica': 'openai/gpt-4o',
    'sustentabilidade': 'google/gemini-2.5-pro',
    'recursos_humanos': 'google/gemini-2.0-flash-exp',
    'cronograma': 'qwen/qwen-2.5-72b-instruct',
    'default': 'google/gemini-2.0-flash-exp'
  };

  const modelId = recommendations[sectionKey] || recommendations.default;
  return {
    provider: 'openrouter',
    id: modelId
  };
};
