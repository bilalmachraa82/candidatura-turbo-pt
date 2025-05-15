
import React, { createContext, useContext, useState, ReactNode } from 'react';

type AIModel = 'gpt-4o' | 'gemini-pro' | 'claude-3-opus';

interface AIContextType {
  model: AIModel;
  setModel: (model: AIModel) => void;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  lastGeneratedAt: Date | null;
  setLastGeneratedAt: (date: Date | null) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [model, setModel] = useState<AIModel>('gpt-4o');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastGeneratedAt, setLastGeneratedAt] = useState<Date | null>(null);

  return (
    <AIContext.Provider value={{
      model,
      setModel,
      isProcessing,
      setIsProcessing,
      lastGeneratedAt,
      setLastGeneratedAt,
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
