
export type AIModel = 
  // OpenRouter Models - Rápidos
  | 'google/gemini-2.0-flash-exp'
  | 'meta-llama/llama-3.1-70b-instruct:free'
  // OpenRouter Models - Equilibrados  
  | 'anthropic/claude-3.5-sonnet'
  | 'openai/gpt-4o-mini'
  // OpenRouter Models - Potentes
  | 'openai/gpt-4o'
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
