
import React, { createContext, useContext, ReactNode } from 'react';
import { generateSection } from '@/lib/generateSection';
import { GenerationSource, adaptLegacySource } from '@/types/api';
import { analytics } from '@/lib/analytics';
import { getOptimalModel, type AIProvider } from '@/lib/modelRouter';

interface GenerateTextParams {
  projectId: string;
  section: string;
  charLimit: number;
  model?: string;
  provider?: AIProvider; // Support all providers: claude, gemini, openrouter
}

interface GenerateTextResult {
  success: boolean;
  text: string;
  sources?: GenerationSource[];
  error?: string;
  provider?: string;
  charsUsed?: number;
  usage?: {
    cachedTokens?: number;
    cacheHitRate?: string;
    estimatedCost?: number;
  };
}

interface AIContextType {
  generateText: (params: GenerateTextParams) => Promise<GenerateTextResult>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI deve ser usado dentro de um AIProvider');
  }
  return context;
};

interface AIProviderProps {
  children: ReactNode;
}

export const AIProvider: React.FC<AIProviderProps> = ({ children }) => {
  const generateText = async (params: GenerateTextParams): Promise<GenerateTextResult> => {
    const startTime = Date.now();

    try {
      console.log('AIContext generateText called with:', params);

      // Use intelligent model routing if no provider specified
      let provider: AIProvider;
      let modelId: string;

      if (params.provider && params.model) {
        // User specified both provider and model - use as-is
        provider = params.provider;
        modelId = params.model;
      } else {
        // Use intelligent routing based on section
        const optimal = getOptimalModel(params.section);
        provider = optimal.provider;
        modelId = optimal.model;

        console.log('Model routing decision:', {
          section: params.section,
          provider: optimal.provider,
          model: optimal.model,
          rationale: optimal.rationale,
          priority: optimal.priority
        });
      }

      // Track AI generation started
      analytics.aiGenerationStarted(params.section, modelId);

      const result = await generateSection(
        params.projectId,
        params.section,
        params.charLimit,
        provider,
        modelId
      );

      const duration = Date.now() - startTime;

      // Track AI generation completed
      analytics.aiGenerationCompleted(
        params.section,
        modelId,
        duration,
        result.text.length
      );

      // Transform to legacy format for compatibility using adapter function
      return {
        success: true,
        text: result.text,
        sources: result.sources?.map(source => adaptLegacySource({
          id: source.id,
          name: source.name,
          reference: source.reference,
          type: source.type
        })) || [],
        provider: provider,
        charsUsed: result.charsUsed
      };

    } catch (error: any) {
      console.error('Error in AIContext generateText:', error);

      // Track AI generation failure
      analytics.aiGenerationFailed(
        params.section,
        params.model || 'auto-routing',
        error.message || 'Erro desconhecido'
      );

      return {
        success: false,
        text: '',
        error: error.message || 'Erro desconhecido ao gerar texto'
      };
    }
  };

  return (
    <AIContext.Provider value={{ generateText }}>
      {children}
    </AIContext.Provider>
  );
};
