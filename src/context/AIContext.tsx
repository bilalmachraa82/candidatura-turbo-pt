
import React, { createContext, useContext, ReactNode } from 'react';
import { generateSection } from '@/lib/generateSection';
import { GenerationSource } from '@/types/api';

interface GenerateTextParams {
  projectId: string;
  section: string;
  charLimit: number;
  model?: string;
  provider?: 'openrouter' | 'flowise';
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
      
      // Determine provider and model from legacy model string or new format
      let provider: 'openrouter' | 'flowise' = 'openrouter';
      let modelId = params.model || 'google/gemini-2.0-flash-exp';
      
      // Handle legacy model format
      if (params.model) {
        switch (params.model) {
          case 'gpt-4o':
          case 'claude-3-opus':
          case 'gemini-pro':
            provider = 'flowise';
            modelId = params.model;
            break;
          default:
            // If it looks like an OpenRouter model (contains /)
            if (params.model.includes('/')) {
              provider = 'openrouter';
              modelId = params.model;
            } else {
              provider = 'flowise';
              modelId = params.model;
            }
        }
      }

      // Override with explicit provider if provided
      if (params.provider) {
        provider = params.provider;
      }

      console.log('Using provider:', provider, 'model:', modelId);

      const result = await generateSection(
        params.projectId,
        params.section,
        params.charLimit,
        provider,
        modelId
      );

      // Transform to legacy format for compatibility
      return {
        success: true,
        text: result.text,
        sources: result.sources?.map(source => ({
          id: source.id,
          name: source.name,
          reference: source.reference,
          type: source.type as 'pdf' | 'excel' | 'document'
        })) || [],
        provider: result.provider,
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
