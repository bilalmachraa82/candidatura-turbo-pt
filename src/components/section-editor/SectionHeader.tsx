
import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import ModelSelector from '@/components/ModelSelector';

interface SectionHeaderProps {
  title: string;
  description?: string;
  selectedModel: string;
  onModelChange: (model: string) => void;
  isGenerating: boolean;
  onGenerateClick: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  selectedModel,
  onModelChange,
  isGenerating,
  onGenerateClick
}) => {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-lg font-semibold text-pt-blue">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      
      <div className="flex items-center space-x-2">
        <ModelSelector 
          value={selectedModel}
          onChange={onModelChange}
          disabled={isGenerating}
        />
        
        <Button 
          variant="default"
          className="bg-pt-green hover:bg-pt-green/90 text-white"
          size="sm"
          disabled={isGenerating}
          onClick={onGenerateClick}
        >
          {isGenerating ? (
            <>
              <Spinner size="sm" className="mr-2" />
              A gerar...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar com IA
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SectionHeader;
