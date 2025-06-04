
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Save, 
  RotateCcw, 
  Copy, 
  Check, 
  AlertCircle,
  Wand2,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ModelSelector from '@/components/ModelSelector';
import { generateSection } from '@/lib/generateSection';
import { supabase } from '@/lib/supabase';

interface ImprovedSectionEditorProps {
  section: {
    id: string;
    projectId: string;
    key: string;
    title: string;
    description: string;
    content: string;
    charLimit: number;
  };
  onContentChange: (sectionId: string, content: string) => void;
  onSourcesUpdate?: (sectionId: string, sources: any[]) => void;
}

const ImprovedSectionEditor: React.FC<ImprovedSectionEditorProps> = ({
  section,
  onContentChange,
  onSourcesUpdate
}) => {
  const [content, setContent] = useState(section.content);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedModel, setSelectedModel] = useState({ provider: 'openrouter', id: 'google/gemini-2.0-flash-exp' });
  const [originalContent, setOriginalContent] = useState(section.content);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setContent(section.content);
    setOriginalContent(section.content);
  }, [section.content]);

  const charCount = content.length;
  const charPercentage = (charCount / section.charLimit) * 100;
  const isOverLimit = charCount > section.charLimit;
  const hasChanges = content !== originalContent;

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange(section.id, newContent);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('sections')
        .update({ 
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', section.id);

      if (error) throw error;

      setOriginalContent(content);
      setLastSaved(new Date());
      
      toast({
        title: "Secção guardada",
        description: "O conteúdo foi guardado com sucesso"
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao guardar",
        description: error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateSection(
        section.projectId,
        section.key,
        section.charLimit,
        selectedModel.provider as 'openrouter' | 'flowise',
        selectedModel.id
      );

      handleContentChange(result.text);
      
      if (onSourcesUpdate && result.sources) {
        onSourcesUpdate(section.id, result.sources);
      }

      toast({
        title: "✨ Conteúdo gerado",
        description: `Gerado ${result.charsUsed} caracteres usando ${selectedModel.provider}`
      });

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro na geração",
        description: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setContent(originalContent);
    onContentChange(section.id, originalContent);
    toast({
      title: "Conteúdo reposto",
      description: "O conteúdo foi reposto à versão guardada"
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copiado",
      description: "Conteúdo copiado para a área de transferência"
    });
  };

  const getCharCountColor = () => {
    if (isOverLimit) return 'text-red-600';
    if (charPercentage > 80) return 'text-amber-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (isOverLimit) return 'bg-red-500';
    if (charPercentage > 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg text-pt-blue mb-1">
              {section.title}
            </CardTitle>
            {section.description && (
              <p className="text-sm text-gray-600 mb-3">
                {section.description}
              </p>
            )}
          </div>
          <Badge variant="outline" className="ml-3">
            {section.key}
          </Badge>
        </div>

        {/* Character Counter and Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${getCharCountColor()}`}>
              {charCount.toLocaleString()} / {section.charLimit.toLocaleString()} caracteres
            </span>
            {isOverLimit && (
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Limite excedido</span>
              </div>
            )}
          </div>
          <Progress 
            value={Math.min(charPercentage, 100)} 
            className="h-2"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-3">
          <ModelSelector
            value={selectedModel}
            onChange={setSelectedModel}
            disabled={isGenerating}
          />
          
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-pt-green hover:bg-pt-green/90"
            size="sm"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                A gerar...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Gerar com IA
              </>
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            variant="outline"
            size="sm"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                A guardar...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </>
            )}
          </Button>

          {hasChanges && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Repor
            </Button>
          )}

          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </>
            )}
          </Button>
        </div>

        {lastSaved && (
          <div className="text-xs text-gray-500 mt-2">
            Última gravação: {lastSaved.toLocaleTimeString('pt-PT')}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <Textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={`Escreva o conteúdo para ${section.title.toLowerCase()} ou use IA para gerar automaticamente...`}
          className={`min-h-[200px] resize-y ${
            isOverLimit ? 'border-red-300 focus:border-red-500' : ''
          }`}
        />
      </CardContent>
    </Card>
  );
};

export default ImprovedSectionEditor;
