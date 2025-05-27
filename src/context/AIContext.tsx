
import React, { createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GenerationSource } from '@/types/api';

interface GenerateTextParams {
  projectId: string;
  section: string;
  charLimit: number;
  model?: string;
}

interface GenerateTextResult {
  success: boolean;
  text: string;
  sources?: GenerationSource[];
  error?: string;
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
      console.log('Gerando texto com parâmetros:', params);
      
      // Usar a Edge Function do Supabase para gerar texto
      const { data, error } = await supabase.functions.invoke('generate-text', {
        body: {
          projectId: params.projectId,
          section: params.section,
          charLimit: params.charLimit,
          model: params.model || 'gpt-4o'
        }
      });

      if (error) {
        console.error('Erro na Edge Function:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Resposta vazia da Edge Function');
      }

      console.log('Resposta da Edge Function:', data);

      return {
        success: true,
        text: data.text || '',
        sources: data.sources || [],
      };
    } catch (error: any) {
      console.error('Erro ao gerar texto:', error);
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
