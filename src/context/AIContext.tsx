
import React, { createContext, useContext, ReactNode } from 'react';
import { GenerationOptions, GenerationResult } from '@/types/api';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AIContextType {
  generateText: (options: GenerationOptions) => Promise<GenerationResult>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  const generateText = async (options: GenerationOptions): Promise<GenerationResult> => {
    try {
      const { projectId, section, charLimit = 2000, model = 'gpt-4o' } = options;

      // Chamar a função Edge do Supabase para geração de texto
      const { data, error } = await supabase.functions.invoke('generate-text', {
        body: { projectId, section, charLimit, model }
      });

      if (error) {
        throw new Error(`Erro na chamada à API: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Falha na geração de texto');
      }

      return {
        success: true,
        text: data.text,
        charsUsed: data.charsUsed,
        sources: data.sources || []
      };
    } catch (error: any) {
      console.error('Erro na geração de texto:', error);
      toast({
        variant: "destructive",
        title: "Erro na geração",
        description: error.message || 'Não foi possível gerar o texto'
      });
      
      return {
        success: false,
        text: '',
        charsUsed: 0,
        sources: [],
        error: error.message
      };
    }
  };

  return (
    <AIContext.Provider value={{ generateText }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI deve ser usado dentro de um AIProvider');
  }
  return context;
};
