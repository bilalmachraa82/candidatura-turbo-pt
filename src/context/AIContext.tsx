
import React, { createContext, useContext, ReactNode } from 'react';
import { generateSection } from '@/lib/generateSection';
import { GenerationSource, adaptLegacySource } from '@/types/api';

interface GenerateTextParams {
  projectId: string;
  section: string;
  charLimit: number;
  model?: string;
  provider?: 'openrouter'; // Only OpenRouter now
}

interface GenerateTextResult {
  success: boolean;
  text: string;
  sources?: GenerationSource[];
  error?: string;
  provider?: string;
  charsUsed?: number;
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
    try {
      console.log('AIContext generateText called with:', params);
      
      // Always use OpenRouter with updated 2025 models
      let modelId = params.model || 'google/gemini-2.0-flash-exp';
      
      // Handle legacy model format and map to 2025 models
      if (params.model) {
        const legacyModelMapping: Record<string, string> = {
          'gpt-4o': 'openai/gpt-4o',
          'gpt-4.1': 'openai/gpt-4o',
          'claude-3-opus': 'anthropic/claude-3.5-sonnet',
          'claude-4-sonnet': 'anthropic/claude-3.5-sonnet',
          'gemini-pro': 'google/gemini-2.5-pro',
          'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
          'gemini-flash': 'google/gemini-2.0-flash-exp'
        };

        // Map legacy models to new ones
        if (legacyModelMapping[params.model]) {
          modelId = legacyModelMapping[params.model];
        } else if (!params.model.includes('/')) {
          // If it's not in OpenRouter format, use default
          modelId = 'google/gemini-2.0-flash-exp';
        } else {
          // Already in OpenRouter format
          modelId = params.model;
        }
      }

      console.log('Using OpenRouter model:', modelId);

      const result = await generateSection(
        params.projectId,
        params.section,
        params.charLimit,
        'openrouter', // Always OpenRouter
        modelId
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
        provider: 'openrouter',
        charsUsed: result.charsUsed
      };

    } catch (error: any) {
      console.error('Error in AIContext generateText:', error);
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
