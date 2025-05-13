
import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAIContext } from '@/context/AIContext';
import type { AIModel } from '@/context/AIContext';

const ModelSelector: React.FC = () => {
  const { selectedModel, setSelectedModel } = useAIContext();

  const handleModelChange = (value: string) => {
    setSelectedModel(value as AIModel);
  };

  return (
    <Select value={selectedModel} onValueChange={handleModelChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Selecione um modelo" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="gpt-4o">GPT-4o</SelectItem>
          <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
          <SelectItem value="claude-3.7">Claude 3.7</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default ModelSelector;
