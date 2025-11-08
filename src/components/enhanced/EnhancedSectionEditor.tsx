
import React, { useState, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles } from 'lucide-react';
import AIGenerationPanel from './AIGenerationPanel';
import { ProjectSection } from '@/types/components';

interface EnhancedSectionEditorProps {
  section: ProjectSection;
  projectId: string;
  onTextChange: (sectionId: string, text: string) => void;
  onSourcesUpdate?: (sectionId: string, sources: any[]) => void;
}

const EnhancedSectionEditor: React.FC<EnhancedSectionEditorProps> = ({
  section,
  projectId,
  onTextChange,
  onSourcesUpdate
}) => {
  const [text, setText] = useState(section.content);
  const [sources, setSources] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aiPanelRef = useRef<HTMLDivElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(section.id, newText);
  };

  const handleAIGeneration = useCallback((generatedText: string, generatedSources: any[]) => {
    setText(generatedText);
    setSources(generatedSources);
    onTextChange(section.id, generatedText);
    if (onSourcesUpdate) {
      onSourcesUpdate(section.id, generatedSources);
    }
  }, [section.id, onTextChange, onSourcesUpdate]);

  const charCount = text.length;
  const charLimit = section.charLimit;
  const progressPercentage = (charCount / charLimit) * 100;
  const isOverLimit = charCount > charLimit;

  const getProgressColor = () => {
    if (progressPercentage <= 60) return 'bg-green-500';
    if (progressPercentage <= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg text-pt-blue">{section.title}</CardTitle>
              <CardDescription className="mt-1">{section.description}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={isOverLimit ? "destructive" : "secondary"}>
                {charCount}/{charLimit} caracteres
              </Badge>
              {sources.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {sources.length} fonte{sources.length !== 1 ? 's' : ''} usada{sources.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progresso do conteúdo</span>
              <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-gray-600'}>
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress 
              value={Math.min(progressPercentage, 100)} 
              className={`h-2 ${getProgressColor()}`}
            />
          </div>

          {text.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 border rounded-lg bg-muted/30">
              <FileText className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm mb-4">
                Esta secção está vazia. Comece a escrever ou gere conteúdo com IA.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => textareaRef.current?.focus()}
                >
                  Escrever Manualmente
                </Button>
                <Button
                  size="sm"
                  onClick={() => aiPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar com IA
                </Button>
              </div>
            </div>
          ) : null}

          <Textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            placeholder={`Escreva o conteúdo para ${section.title}...`}
            className={`min-h-[200px] resize-y ${isOverLimit ? 'border-red-300 focus:border-red-500' : ''} ${text.length === 0 ? 'sr-only' : ''}`}
            maxLength={charLimit + 500} // Allow slight overflow for editing
          />

          {isOverLimit && (
            <p className="text-sm text-red-600">
              ⚠️ O texto excede o limite de caracteres em {charCount - charLimit} caracteres.
            </p>
          )}

          {sources.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Fontes utilizadas:</h4>
              <div className="space-y-1">
                {sources.map((source, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-pt-green rounded-full"></span>
                    <span className="font-medium">{source.name}</span>
                    <span>- {source.reference}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div ref={aiPanelRef}>
        <AIGenerationPanel
          projectId={projectId}
          sectionKey={section.key}
          sectionTitle={section.title}
          charLimit={charLimit}
          onGenerated={handleAIGeneration}
          disabled={false}
        />
      </div>
    </div>
  );
};

export default EnhancedSectionEditor;
