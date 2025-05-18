
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GenerationOptions, GenerationResult } from '@/types/api';

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

  // Implementation of generateText function
  const generateText = async (options: GenerationOptions): Promise<GenerationResult> => {
    try {
      setIsProcessing(true);
      
      // Make API call to our generate endpoint
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
      }
      
      const result = await response.json();
      setLastGeneratedAt(new Date());
      
      return result;
    } catch (error: any) {
      console.error('Error generating text:', error);
      return {
        success: false,
        error: error.message || 'Error generating text',
        text: '',
        charsUsed: 0,
        sources: []
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
