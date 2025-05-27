
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAI } from '@/context/AIContext';
import { GenerationSource } from '@/types/api';

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
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const { toast } = useToast();
  const { generateText } = useAI();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(newText);
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
      
      const result = await generateText({
        projectId,
        section: sectionKey,
        charLimit,
        model: selectedModel
      });
      
      if (result.success) {
        setText(result.text);
        onTextChange(result.text);
        
        // Atualizar fontes
        if (result.sources) {
          onSourcesUpdate(result.sources);
        }
        
        toast({
          title: "Texto gerado",
          description: "O texto foi gerado com sucesso."
        });
        
        // Salvar automaticamente o texto gerado
        await handleSave();
      } else {
        throw new Error(result.error || "Falha ao gerar texto");
      }
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
