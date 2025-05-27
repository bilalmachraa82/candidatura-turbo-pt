
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ModelSelectorProps {
  value: { provider: string; id: string };
  onChange: (value: { provider: string; id: string }) => void;
  disabled?: boolean;
}

const MODELS = [
  {
    provider: 'openrouter',
    group: '⚡ Rápido & Económico',
    items: [
      { id: 'google/gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash', cost: '€' },
      { id: 'meta-llama/llama-3.1-70b-instruct:free', label: 'Llama 3.1 70B (Grátis)', cost: 'FREE' }
    ]
  },
  {
    provider: 'openrouter', 
    group: '💡 Equilibrado',
    items: [
      { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', cost: '€€' },
      { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', cost: '€' }
    ]
  },
  {
    provider: 'openrouter',
    group: '🚀 Máxima Qualidade', 
    items: [
      { id: 'openai/gpt-4o', label: 'GPT-4o', cost: '€€€' },
      { id: 'anthropic/claude-3-opus', label: 'Claude 3 Opus', cost: '€€€€' }
    ]
  },
  {
    provider: 'flowise',
    group: '🔗 Flowise (Legacy)',
    items: [
      { id: 'gpt-4o', label: 'GPT-4o (Flowise)', cost: '€€€' }
    ]
  }
];

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  value, 
  onChange,
  disabled = false 
}) => {
  const currentModel = MODELS
    .flatMap(group => group.items.map(item => ({ ...item, provider: group.provider })))
    .find(model => model.provider === value.provider && model.id === value.id);

  return (
    <div className="space-y-2">
      <Select 
        value={`${value.provider}:${value.id}`}
        onValueChange={(newValue) => {
          const [provider, id] = newValue.split(':');
          onChange({ provider, id });
        }}
        disabled={disabled}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione o modelo IA">
            {currentModel && (
              <div className="flex items-center gap-2">
                <span className="truncate">{currentModel.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {currentModel.cost}
                </Badge>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MODELS.map((group) => (
            <div key={group.group}>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                {group.group}
              </div>
              {group.items.map((item) => (
                <SelectItem 
                  key={`${group.provider}:${item.id}`}
                  value={`${group.provider}:${item.id}`}
                  className="pl-4"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{item.label}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {item.cost}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
      
      {currentModel && (
        <div className="text-xs text-muted-foreground">
          Provider: {value.provider === 'openrouter' ? 'OpenRouter' : 'Flowise'}
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
