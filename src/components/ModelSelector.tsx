
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ModelSelectorProps {
  value: { provider: string; id: string };
  onChange: (value: { provider: string; id: string }) => void;
  disabled?: boolean;
}

const MODELS = [
  {
    provider: 'openrouter',
    group: '🚀 Premium Quality (2025)',
    items: [
      { 
        id: 'anthropic/claude-3.5-sonnet-20241022', 
        label: 'Claude 3.5 Sonnet', 
        cost: '€€€',
        specialty: 'Melhor para escrita técnica e análise'
      },
      { 
        id: 'google/gemini-2.5-pro', 
        label: 'Gemini 2.5 Pro', 
        cost: '€€€',
        specialty: 'Excelente RAG e português técnico'
      },
      { 
        id: 'openai/gpt-4o', 
        label: 'GPT-4o', 
        cost: '€€€',
        specialty: 'Consistente para planos financeiros'
      }
    ]
  },
  {
    provider: 'openrouter',
    group: '⚡ Rápido & Eficaz (2025)', 
    items: [
      { 
        id: 'google/gemini-2.5-flash', 
        label: 'Gemini 2.5 Flash', 
        cost: '€',
        specialty: 'Rápido, ideal para descrições'
      },
      { 
        id: 'google/gemini-2.0-flash-thinking-exp', 
        label: 'Gemini 2.0 Flash Thinking', 
        cost: '€€',
        specialty: 'Raciocínio melhorado'
      },
      { 
        id: 'anthropic/claude-3.5-sonnet', 
        label: 'Claude 3.5 Sonnet (Stable)', 
        cost: '€€',
        specialty: 'Equilibrio qualidade-velocidade'
      }
    ]
  },
  {
    provider: 'openrouter',
    group: '💡 Inteligente & Económico',
    items: [
      { 
        id: 'qwen/qwen-2.5-72b-instruct', 
        label: 'Qwen 2.5 72B', 
        cost: '€',
        specialty: 'Alternativa económica de qualidade'
      },
      { 
        id: 'meta-llama/llama-3.3-70b-instruct', 
        label: 'Llama 3.3 70B', 
        cost: '€',
        specialty: 'Open source, boa para PT'
      },
      { 
        id: 'google/gemini-2.0-flash-exp', 
        label: 'Gemini 2.0 Flash (Legacy)', 
        cost: '€',
        specialty: 'Fallback confiável'
      }
    ]
  },
  {
    provider: 'openrouter',
    group: '🧠 Casos Especiais',
    items: [
      { 
        id: 'openai/o1-mini', 
        label: 'O1-Mini (Reasoning)', 
        cost: '€€€€',
        specialty: 'Para análises complexas'
      },
      { 
        id: 'anthropic/claude-3-opus', 
        label: 'Claude 3 Opus', 
        cost: '€€€€',
        specialty: 'Máxima criatividade'
      }
    ]
  },
  {
    provider: 'flowise',
    group: '🔗 Flowise (Legacy)',
    items: [
      { 
        id: 'gpt-4o', 
        label: 'GPT-4o (Flowise)', 
        cost: '€€€',
        specialty: 'Fallback via Flowise'
      }
    ]
  }
];

// Modelos recomendados por tipo de secção PT2030
const SECTION_RECOMMENDATIONS: Record<string, string> = {
  'analise_mercado': 'google/gemini-2.5-pro',
  'proposta_valor': 'anthropic/claude-3.5-sonnet-20241022',
  'plano_financeiro': 'openai/gpt-4o',
  'estrategia_comercial': 'google/gemini-2.5-flash',
  'inovacao_tecnologica': 'anthropic/claude-3.5-sonnet-20241022',
  'sustentabilidade': 'google/gemini-2.5-pro',
  'recursos_humanos': 'google/gemini-2.5-flash',
  'cronograma': 'qwen/qwen-2.5-72b-instruct',
  'default': 'google/gemini-2.5-flash'
};

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  value, 
  onChange,
  disabled = false 
}) => {
  const currentModel = MODELS
    .flatMap(group => group.items.map(item => ({ ...item, provider: group.provider })))
    .find(model => model.provider === value.provider && model.id === value.id);

  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'FREE': return 'bg-green-100 text-green-800';
      case '€': return 'bg-blue-100 text-blue-800';
      case '€€': return 'bg-yellow-100 text-yellow-800';
      case '€€€': return 'bg-orange-100 text-orange-800';
      case '€€€€': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <Select 
          value={`${value.provider}:${value.id}`}
          onValueChange={(newValue) => {
            const [provider, id] = newValue.split(':');
            onChange({ provider, id });
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Selecione o modelo IA">
              {currentModel && (
                <div className="flex items-center gap-2">
                  <span className="truncate">{currentModel.label}</span>
                  <Badge variant="secondary" className={`text-xs ${getCostColor(currentModel.cost)}`}>
                    {currentModel.cost}
                  </Badge>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[400px]">
            {MODELS.map((group) => (
              <div key={group.group}>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-b">
                  {group.group}
                </div>
                {group.items.map((item) => (
                  <Tooltip key={`${group.provider}:${item.id}`}>
                    <TooltipTrigger asChild>
                      <SelectItem 
                        value={`${group.provider}:${item.id}`}
                        className="pl-4 cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="flex-1">{item.label}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getCostColor(item.cost)}`}
                            >
                              {item.cost}
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.specialty}</p>
                        <p className="text-xs">
                          Provider: {group.provider === 'openrouter' ? 'OpenRouter' : 'Flowise'}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        
        {currentModel && (
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <span>Provider: {value.provider === 'openrouter' ? 'OpenRouter' : 'Flowise'}</span>
              <Badge variant="outline" className={`text-xs ${getCostColor(currentModel.cost)}`}>
                {currentModel.cost}
              </Badge>
            </div>
            <p className="text-xs italic">{currentModel.specialty}</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default ModelSelector;
