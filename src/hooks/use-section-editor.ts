
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAutoSave } from '@/hooks/use-auto-save';
import { supabase } from '@/lib/supabase';
import { generateSection } from '@/lib/generateSection';
import { GenerationSource, adaptLegacySource } from '@/types/api';

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
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Always use OpenRouter with recommended model
  const [selectedModel, setSelectedModel] = useState<{ provider: string; id: string }>({
    provider: 'openrouter',
    id: 'google/gemini-2.0-flash-exp'
  });
  
  const { toast } = useToast();

  // Função para guardar na base de dados
  const saveToDatabase = async (content: string) => {
    const { error } = await supabase
      .from('sections')
      .update({ 
        content, 
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .eq('key', sectionKey);
    
    if (error) throw error;
  };

  // Hook de auto-save
  const { saveStatus, hasUnsavedChanges, manualSave } = useAutoSave({
    data: text,
    onSave: saveToDatabase,
    delay: 3000, // 3 segundos de delay
    enabled: true
  });

  // Sincronizar texto inicial
  useEffect(() => {
    if (initialText !== text) {
      setText(initialText);
    }
  }, [initialText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(newText);
  };

  const handleSave = async () => {
    try {
      await manualSave();
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
    }
  };

  const handleGenerateText = async () => {
    try {
      setIsGenerating(true);
      
      console.log('Generating with OpenRouter model:', selectedModel.id);
      
      const result = await generateSection(
        projectId,
        sectionKey,
        charLimit,
        'openrouter', // Always OpenRouter
        selectedModel.id
      );
      
      setText(result.text);
      onTextChange(result.text);
      
      // Actualizar fontes usando adapter para converter formato legacy
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
        description: `Gerado com OpenRouter usando ${selectedModel.id.split('/').pop()}`
      });
      
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
    saveStatus,
    hasUnsavedChanges,
    isGenerating,
    selectedModel,
    setSelectedModel,
    handleTextChange,
    handleSave,
    handleGenerateText
  };
};
