
import React, { createContext, useState, useContext } from 'react';

type AIModel = 'gpt-4o' | 'gemini-pro' | 'claude-3-opus';

interface AIContextType {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  loading: boolean;
  ragStatus: 'poor' | 'medium' | 'good';
  setRagStatus: (status: 'poor' | 'medium' | 'good') => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-4o');
  const [loading, setLoading] = useState(false);
  const [ragStatus, setRagStatus] = useState<'poor' | 'medium' | 'good'>('medium');

  return (
    <AIContext.Provider value={{ 
      selectedModel, 
      setSelectedModel, 
      loading, 
      ragStatus,
      setRagStatus
    }}>
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
