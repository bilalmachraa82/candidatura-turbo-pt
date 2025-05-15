
import React, { useState, useEffect } from 'react';
import { Wand2, Save, FileText, FileSpreadsheet } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAI } from '@/context/AIContext';
import { supabase } from '@/lib/supabase';
import { generateText } from '@/api/generateText';
import { GenerationSource } from '@/types/api';

interface SectionEditorProps {
  title: string;
  description: string;
  sectionKey: string;
  projectId: string;
  initialText?: string;
  charLimit: number;
  onTextChange?: (text: string) => void;
  onSave?: (text: string) => void;
  onSourcesUpdate?: (sources: GenerationSource[]) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  title,
  description,
  sectionKey,
  projectId,
  initialText = '',
  charLimit,
  onTextChange,
  onSave,
  onSourcesUpdate
}) => {
  const [text, setText] = useState(initialText);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sources, setSources] = useState<GenerationSource[]>([]);
  const { toast } = useToast();
  const { model: selectedModel } = useAI();
  const charsUsed = text.length;
  const isOverLimit = charsUsed > charLimit;

  // Initialize text with initialText
  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  // Call onTextChange only when text actually changes and when onTextChange exists
  useEffect(() => {
    if (onTextChange) {
      onTextChange(text);
    }
  }, [text, onTextChange]);

  // Call onSourcesUpdate only when sources change and when onSourcesUpdate exists
  useEffect(() => {
    if (onSourcesUpdate) {
      onSourcesUpdate(sources);
    }
  }, [sources, onSourcesUpdate]);

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
      const result = await generateText(projectId, sectionKey, charLimit, selectedModel);
      setText(result.text);
      setSources(result.sources);
      
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
            <Save className="mr-2 h-4 w-4" />
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
      
      {sources.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Fontes Consultadas</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {sources.map((source, index) => (
              <li key={source.id || index} className="flex items-center">
                {source.type === 'pdf' ? (
                  <FileText className="h-3 w-3 text-red-500 mr-1" />
                ) : (
                  <FileSpreadsheet className="h-3 w-3 text-green-600 mr-1" />
                )}
                <span>{source.name}: {source.reference}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SectionEditor;
