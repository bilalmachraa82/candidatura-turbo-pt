
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { generateSection } from '@/lib/generateSection';
import { GenerationSource } from '@/types/api';
import { getSectionRecommendedModel } from '@/types/ai';

interface UseSectionEditorProps {
  projectId: string;
  sectionKey: string;
  initialText: string;
  charLimit: number;
  onTextChange: (text: string) => void;
  onSourcesUpdate: (sources: GenerationSource[]) => void;
}

export const useSectionEditor = ({
  projectId,
  sectionKey,
  initialText,
  charLimit,
  onTextChange,
  onSourcesUpdate
}: UseSectionEditorProps) => {
  const [text, setText] = useState(initialText);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Usar modelo recomendado baseado na secção
  const [selectedModel, setSelectedModel] = useState<{ provider: string; id: string }>(() => {
    return getSectionRecommendedModel(sectionKey);
  });
  
  const { toast } = useToast();

  // Atualizar modelo recomendado quando a secção muda
  useEffect(() => {
    const recommendedModel = getSectionRecommendedModel(sectionKey);
    setSelectedModel(recommendedModel);
  }, [sectionKey]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(newText);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Actualizar o conteúdo da secção no Supabase
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
        title: "Secção guardada",
        description: "O conteúdo foi guardado com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao guardar secção:', error);
      toast({
        variant: "destructive",
        title: "Erro ao guardar",
        description: error.message || "Não foi possível guardar o conteúdo."
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
      
      // Actualizar fontes
      if (result.sources) {
        const sources: GenerationSource[] = result.sources.map(source => ({
          id: source.id,
          name: source.name,
          reference: source.reference,
          type: source.type as 'pdf' | 'excel' | 'document'
        }));
        onSourcesUpdate(sources);
      }
      
      toast({
        title: "Texto gerado",
        description: `Gerado com ${result.provider} usando ${selectedModel.id.split('/').pop()}`
      });
      
      // Guardar automaticamente o texto gerado
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

  return {
    text,
    setText,
    isSaving,
    isGenerating,
    selectedModel,
    setSelectedModel,
    handleTextChange,
    handleSave,
    handleGenerateText
  };
};
