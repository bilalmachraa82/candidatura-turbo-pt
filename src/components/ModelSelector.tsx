
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ModelSelectorProps {
  value: { provider: string; id: string };
  onChange: (value: { provider: string; id: string }) => void;
  disabled?: boolean;
}

const AI_MODELS = [
  // OpenRouter Models (Recommended)
  {
    provider: 'openrouter',
    id: 'google/gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash (Experimental)',
    description: 'Mais rápido e eficiente',
    badge: 'Recomendado'
  },
  {
    provider: 'openrouter',
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Excelente para texto técnico',
    badge: 'Premium'
  },
  {
    provider: 'openrouter',
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Modelo versátil da OpenAI',
    badge: 'Popular'
  },
  {
    provider: 'openrouter',
    id: 'meta-llama/llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B',
    description: 'Modelo open-source avançado',
    badge: 'Open Source'
  },
  
  // Flowise Models (Fallback)
  {
    provider: 'flowise',
    id: 'gpt-4o',
    name: 'GPT-4o (Flowise)',
    description: 'Via Flowise endpoint',
    badge: 'Backup'
  },
  {
    provider: 'flowise',
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini (Flowise)',
    description: 'Versão mais rápida via Flowise',
    badge: 'Backup'
  }
];

const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  const handleValueChange = (newValue: string) => {
    const [provider, ...idParts] = newValue.split(':');
    const id = idParts.join(':');
    onChange({ provider, id });
  };

  const getBadgeVariant = (badge: string) => {
    switch (badge) {
      case 'Recomendado':
        return 'default';
      case 'Premium':
        return 'secondary';
      case 'Popular':
        return 'outline';
      case 'Open Source':
        return 'outline';
      case 'Backup':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const currentValue = `${value.provider}:${value.id}`;
  const currentModel = AI_MODELS.find(model => `${model.provider}:${model.id}` === currentValue);

  return (
    <div className="w-64">
      <Select
        value={currentValue}
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecionar modelo IA">
            {currentModel && (
              <div className="flex items-center gap-2">
                <span className="truncate">{currentModel.name}</span>
                <Badge variant={getBadgeVariant(currentModel.badge)} className="text-xs">
                  {currentModel.badge}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="w-80">
          {AI_MODELS.map((model) => (
            <SelectItem
              key={`${model.provider}:${model.id}`}
              value={`${model.provider}:${model.id}`}
              className="flex flex-col items-start p-3"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    <Badge variant={getBadgeVariant(model.badge)} className="text-xs">
                      {model.badge}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {model.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {currentModel && (
        <p className="text-xs text-gray-500 mt-1">
          Provider: {currentModel.provider === 'openrouter' ? 'OpenRouter' : 'Flowise'} • {currentModel.description}
        </p>
      )}
    </div>
  );
};

export default ModelSelector;
