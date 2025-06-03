
import React from 'react';
import { CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import ModelSelector from '@/components/ModelSelector';
import SaveStatus from './SaveStatus';
import { SaveStatus as SaveStatusType } from '@/hooks/use-auto-save';

interface SectionHeaderProps {
  title: string;
  description?: string;
  selectedModel: { provider: string; id: string };
  onModelChange: (model: { provider: string; id: string }) => void;
  isGenerating: boolean;
  onGenerateClick: () => void;
  saveStatus: SaveStatusType;
  hasUnsavedChanges: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  selectedModel,
  onModelChange,
  isGenerating,
  onGenerateClick,
  saveStatus,
  hasUnsavedChanges
}) => {
  return (
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <CardTitle className="text-lg font-semibold text-pt-blue">{title}</CardTitle>
          <SaveStatus status={saveStatus} hasUnsavedChanges={hasUnsavedChanges} />
        </div>
        {description && <CardDescription>{description}</CardDescription>}
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
