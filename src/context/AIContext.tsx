
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GenerationOptions, GenerationResult } from '@/types/api';
import { useToast } from '@/hooks/use-toast';

type AIModel = 'gpt-4o' | 'gemini-pro' | 'claude-3-opus';

interface AIContextType {
  model: AIModel;
  setModel: (model: AIModel) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  lastGeneratedAt: Date | null;
  setLastGeneratedAt: (date: Date | null) => void;
  generateText: (options: GenerationOptions) => Promise<GenerationResult>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [model, setModel] = useState<AIModel>('gpt-4o');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);
  const { toast } = useToast();

  // Implementation of generateText function using Flowise API
  const generateText = async (options: GenerationOptions): Promise<GenerationResult> => {
    try {
      setIsProcessing(true);
      
      const FLOWISE_URL = import.meta.env.VITE_FLOWISE_URL;
      const FLOWISE_API_KEY = import.meta.env.VITE_FLOWISE_API_KEY;
      
      if (!FLOWISE_URL) {
        throw new Error('FLOWISE_URL não está configurado');
      }
      
      // Make API call to Flowise Generate endpoint
      const response = await fetch(`${FLOWISE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FLOWISE_API_KEY}`
        },
        body: JSON.stringify({
          projectId: options.projectId,
          section: options.section,
          charLimit: options.charLimit || 2000,
          model: options.model || model
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
      }
      
      const result = await response.json();
      setLastGeneratedAt(new Date());
      
      return {
        success: true,
        text: result.text || '',
        charsUsed: result.charsUsed || 0,
        sources: result.sources || [],
        error: undefined
      };
    } catch (error: any) {
      console.error('Error generating text:', error);
      toast({
        variant: "destructive",
        title: "Erro na geração",
        description: error.message || "Não foi possível gerar o texto"
      });
      
      return {
        success: false,
        text: '',
        charsUsed: 0,
        sources: [],
        error: error.message || 'Erro desconhecido'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AIContext.Provider value={{
      model,
      setModel,
      isProcessing,
      setIsProcessing,
      lastGeneratedAt,
      setLastGeneratedAt,
      generateText
    }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
