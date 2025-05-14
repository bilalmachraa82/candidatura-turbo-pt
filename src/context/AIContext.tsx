
import React, { createContext, useContext, useState } from 'react';

type AIModel = 'gpt-4o' | 'claude-3-sonnet' | 'gemini-pro';

interface AIContextProps {
  model: AIModel;
  setModel: (model: AIModel) => void;
  charsGenerated: number;
  addCharsGenerated: (count: number) => void;
  resetCharsGenerated: () => void;
}

const AIContext = createContext<AIContextProps | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [model, setModel] = useState<AIModel>('gpt-4o');
  const [charsGenerated, setCharsGenerated] = useState(0);

  const addCharsGenerated = (count: number) => {
    setCharsGenerated(prev => prev + count);
  };

  const resetCharsGenerated = () => {
    setCharsGenerated(0);
  };

  const value = {
    model,
    setModel,
    charsGenerated,
    addCharsGenerated,
    resetCharsGenerated
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
