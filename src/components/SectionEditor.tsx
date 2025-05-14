
import React, { useState, useEffect } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAIContext } from '@/context/AIContext';
import { supabase } from '@/lib/supabase';

interface SectionEditorProps {
  title: string;
  description: string;
  sectionKey: string;
  projectId: string;
  initialText?: string;
  charLimit: number;
  onTextChange?: (text: string) => void;
  onSave?: (text: string) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  title,
  description,
  sectionKey,
  projectId,
  initialText = '',
  charLimit,
  onTextChange,
  onSave
}) => {
  const [text, setText] = useState(initialText);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { selectedModel } = useAIContext();
  const charsUsed = text.length;
  const isOverLimit = charsUsed > charLimit;

  useEffect(() => {
    if (onTextChange) {
      onTextChange(text);
    }
  }, [text, onTextChange]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleGenerateText = async () => {
    if (!projectId || !sectionKey) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "ID do projeto ou secção em falta."
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          sectionKey,
          charLimit,
          model: selectedModel
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro na geração de texto');
      }
      
      const data = await response.json();
      setText(data.text);
      
      toast({
        title: "Texto gerado com sucesso",
        description: `Gerado utilizando ${selectedModel}.`
      });
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({
        variant: "destructive",
        title: "Erro na geração de texto",
        description: error.message || "Não foi possível gerar o texto. Por favor tente novamente."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!projectId || !sectionKey) {
      toast({
        variant: "destructive",
        title: "Erro ao guardar",
        description: "ID do projeto ou secção em falta."
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Update section content in Supabase
      const { error } = await supabase
        .from('sections')
        .update({ content: text, updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('key', sectionKey);

      if (error) throw error;

      if (onSave) {
        onSave(text);
      }
      
      toast({
        title: "Secção guardada",
        description: "O conteúdo foi guardado com sucesso."
      });
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao guardar",
        description: error.message || "Não foi possível guardar o conteúdo."
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium text-pt-blue">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button
            className="bg-pt-blue hover:bg-pt-blue/90"
            onClick={handleGenerateText}
            disabled={isGenerating}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {isGenerating ? "A gerar..." : "Gerar com IA"}
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isSaving || isOverLimit}
            className="border-pt-blue text-pt-blue hover:bg-pt-blue/10"
          >
            {isSaving ? "A guardar..." : "Guardar"}
          </Button>
        </div>
      </div>
      
      <Textarea
        value={text}
        onChange={handleTextChange}
        placeholder={`Escreva ou gere conteúdo para ${title}...`}
        className={`min-h-[200px] ${isOverLimit ? 'border-pt-red' : ''}`}
      />
      
      <div className="flex justify-between mt-2 text-sm">
        <span className={`${isOverLimit ? 'text-pt-red' : 'text-gray-500'}`}>
          {charsUsed} / {charLimit} caracteres
        </span>
        {isOverLimit && (
          <span className="text-pt-red">
            Excedeu o limite em {charsUsed - charLimit} caracteres
          </span>
        )}
      </div>
    </div>
  );
};

export default SectionEditor;
