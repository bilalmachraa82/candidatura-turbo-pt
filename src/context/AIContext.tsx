
import React, { createContext, useState, useContext } from 'react';

type AIModel = 'gpt-4o' | 'gemini-2.5-pro' | 'claude-3.7';

interface AIContextType {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-4o');

  return (
    <AIContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </AIContext.Provider>
  );
}

export const useAIContext = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAIContext must be used within an AIProvider');
  }
  return context;
};
