import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Save } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { generateSection } from '@/lib/generateSection';
import ModelSelector from '@/components/ModelSelector';
import ChatThread from '@/components/ChatThread';
import { GenerationSource, adaptLegacySource } from '@/types/api';

interface SectionEditorProps {
  title: string;
  description?: string;
  sectionKey: string;
  projectId: string;
  initialText: string;
  charLimit: number;
  onTextChange: (text: string) => void;
  onSourcesUpdate: (sources: GenerationSource[]) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  title,
  description,
  sectionKey,
  projectId,
  initialText = '',
  charLimit = 2000,
  onTextChange,
  onSourcesUpdate
}) => {
  const [text, setText] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<{ provider: string; id: string }>({
    provider: 'openrouter',
    id: 'google/gemini-2.0-flash-exp'
  });
  const { toast } = useToast();

  useEffect(() => {
    // Sincronizar o texto com o estado inicial
    if (initialText !== text) {
      setText(initialText);
    }
  }, [initialText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTextChange(e.target.value);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Atualizar o conteúdo da seção no Supabase
      const { error } = await supabase
        .from('sections')
        .update({ 
          content: text, 
          updated_at: new Date().toISOString()
        })
        .eq('project_id', projectId)
        .eq('key', sectionKey);
      
      if (error) throw error;
      
      toast({
        title: "Seção salva",
        description: "O conteúdo foi salvo com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao salvar seção:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar o conteúdo."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateText = async () => {
    try {
      setIsGenerating(true);
      
      console.log('Generating with model:', selectedModel);
      
      const result = await generateSection(
        projectId,
        sectionKey,
        charLimit,
        selectedModel.provider as 'openrouter' | 'flowise',
        selectedModel.id
      );
      
      setText(result.text);
      onTextChange(result.text);
      
      // Atualizar fontes usando adapter para converter formato legacy
      if (result.sources) {
        const sources: GenerationSource[] = result.sources.map(source => adaptLegacySource({
          id: source.id,
          name: source.name,
          reference: source.reference,
          type: source.type
        }));
        onSourcesUpdate(sources);
      }
      
      toast({
        title: "Texto gerado",
        description: `Gerado com ${result.provider} (${selectedModel.id})`
      });
      
      // Salvar automaticamente o texto gerado
      await handleSave();
      
    } catch (error: any) {
      console.error('Erro ao gerar texto:', error);
      toast({
        variant: "destructive",
        title: "Erro na geração",
        description: error.message || "Não foi possível gerar o texto."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const charsCount = text.length;
  const charsPercentage = Math.min(100, Math.round((charsCount / charLimit) * 100));
  
  // Determinar a cor da barra de progresso
  let progressColor = "bg-green-500";
  if (charsPercentage > 90) {
    progressColor = "bg-red-500";
  } else if (charsPercentage > 75) {
    progressColor = "bg-yellow-500";
  }

  const handleChatGenerated = (generatedText: string) => {
    setText(generatedText);
    onTextChange(generatedText);
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-semibold text-pt-blue">{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            
            <div className="flex items-center space-x-2">
              <ModelSelector 
                value={selectedModel}
                onChange={setSelectedModel}
                disabled={isGenerating}
              />
              
              <Button 
                variant="default"
                className="bg-pt-green hover:bg-pt-green/90 text-white"
                size="sm"
                disabled={isGenerating}
                onClick={handleGenerateText}
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
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <Textarea
              value={text}
              onChange={handleTextChange}
              placeholder={`Escreva o conteúdo para ${title} aqui...`}
              className="min-h-[200px] resize-y"
            />
            
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  <span className={charsCount > charLimit ? "text-red-600 font-medium" : ""}>
                    {charsCount}
                  </span>
                  /{charLimit} caracteres
                </span>
                <span>{charsPercentage}%</span>
              </div>
              
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${progressColor} transition-all`}
                  style={{ width: `${charsPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    A salvar...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini-chat for section refinement */}
      <ChatThread
        projectId={projectId}
        section={sectionKey}
        charLimit={charLimit}
        model={selectedModel}
        onTextGenerated={handleChatGenerated}
      />
    </div>
  );
};

export default SectionEditor;
