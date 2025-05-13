
import React, { useState, useEffect } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAIContext } from '@/context/AIContext';

interface SectionEditorProps {
  title: string;
  description: string;
  sectionKey: string;
  projectId: string;
  initialText?: string;
  charLimit: number;
  onTextChange?: (text: string) => void;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  title,
  description,
  sectionKey,
  projectId,
  initialText = '',
  charLimit,
  onTextChange
}) => {
  const [text, setText] = useState(initialText);
  const [isGenerating, setIsGenerating] = useState(false);
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
    setIsGenerating(true);
    
    try {
      // Mock API call - would be replaced with actual AI generation call
      // POST /api/generate with { projectId, sectionKey, charLimit }
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response
      const generatedText = `Este é um texto gerado pelo modelo de IA ${selectedModel} para a secção "${title}" do projeto ${projectId}. 

O texto foi gerado considerando os documentos carregados e adaptado aos limites de caracteres estabelecidos (${charLimit}). Esta proposta aborda os pontos principais necessários para esta secção, incluindo análise de mercado, público-alvo e previsões.

Os dados extraídos dos seus documentos carregados foram utilizados para informar esta geração, garantindo que o conteúdo está alinhado com a sua estratégia.`;

      setText(generatedText);
      
      toast({
        title: "Texto gerado com sucesso",
        description: `Gerado utilizando ${selectedModel}.`
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        variant: "destructive",
        title: "Erro na geração de texto",
        description: "Não foi possível gerar o texto. Por favor tente novamente."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium text-pt-blue">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Button
          className="mt-2 sm:mt-0 bg-pt-blue hover:bg-pt-blue/90"
          onClick={handleGenerateText}
          disabled={isGenerating}
        >
          <Wand2 className="mr-2 h-4 w-4" />
          {isGenerating ? "A gerar..." : "Gerar com IA"}
        </Button>
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
