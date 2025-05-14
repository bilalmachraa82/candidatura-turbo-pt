
import React from 'react';
import { Check, ChevronsUpDown, Sparkles, Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAIContext } from '@/context/AIContext';

type ModelOption = {
  value: 'gpt-4o' | 'gemini-pro' | 'claude-3-opus';
  label: string;
  description: string;
  icon: React.ReactNode;
}

const models: ModelOption[] = [
  {
    value: 'gpt-4o',
    label: 'GPT-4o',
    description: 'Mais rápido e equilibrado',
    icon: <Zap className="h-4 w-4 text-yellow-500" />,
  },
  {
    value: 'gemini-pro',
    label: 'Gemini Pro',
    description: 'Melhor para análises técnicas',
    icon: <Sparkles className="h-4 w-4 text-blue-500" />,
  },
  {
    value: 'claude-3-opus',
    label: 'Claude 3 Opus',
    description: 'Ideal para textos complexos',
    icon: <Brain className="h-4 w-4 text-purple-500" />,
  },
];

const ModelSelector = () => {
  const [open, setOpen] = React.useState(false);
  const { selectedModel, setSelectedModel } = useAIContext();

  const selectedModelData = models.find(model => model.value === selectedModel);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center">
            {selectedModelData?.icon}
            <span className="ml-2">{selectedModelData?.label}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0">
        <Command>
          <CommandInput placeholder="Pesquisar modelo..." />
          <CommandList>
            <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <CommandItem
                  key={model.value}
                  value={model.value}
                  onSelect={() => {
                    setSelectedModel(model.value);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    {model.icon}
                    <div className="ml-2">
                      <p className="text-sm font-medium">{model.label}</p>
                      <p className="text-xs text-muted-foreground">{model.description}</p>
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedModel === model.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ModelSelector;
