
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { AIModel } from '@/types/ai';

type AIContextType = {
  model: AIModel;
  setModel: (model: AIModel) => void;
};

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<AIModel>('gpt-4o');

  return (
    <AIContext.Provider value={{ model, setModel }}>
      {children}
    </AIContext.Provider>
  );
}

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
