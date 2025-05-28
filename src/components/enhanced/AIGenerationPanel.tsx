
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Brain, Zap, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateText } from '@/api/generateText';
import ModelSelector from '@/components/ModelSelector';

interface AIGenerationPanelProps {
  projectId: string;
  sectionKey: string;
  sectionTitle: string;
  charLimit: number;
  onGenerated: (text: string, sources: any[]) => void;
  disabled?: boolean;
}

const AIGenerationPanel: React.FC<AIGenerationPanelProps> = ({
  projectId,
  sectionKey,
  sectionTitle,
  charLimit,
  onGenerated,
  disabled = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState<{ provider: string; id: string }>({
    provider: 'openrouter',
    id: 'google/gemini-2.5-flash'
  });
  const [language, setLanguage] = useState('pt');
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const result = await generateText({
        projectId,
        section: sectionKey,
        charLimit,
        model: selectedModel.id,
        language
      });

      if (result.success) {
        onGenerated(result.text || '', result.sources || []);
        toast({
          title: "Conteúdo gerado com sucesso",
          description: `${result.charsUsed} caracteres gerados usando ${selectedModel.id.split('/').pop()}`,
        });
      } else {
        throw new Error(result.error || 'Erro na geração');
      }
    } catch (error: any) {
      console.error('Erro na geração:', error);
      toast({
        variant: "destructive",
        title: "Erro na geração",
        description: error.message || "Não foi possível gerar o conteúdo",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-pt-green/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-pt-blue">
          <Brain className="h-5 w-5" />
          Geração com IA
        </CardTitle>
        <CardDescription>
          Gere conteúdo automaticamente para: {sectionTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Modelo de IA</label>
            <ModelSelector 
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={isGenerating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Idioma</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Como funciona:</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>• Analisa os documentos carregados no projeto</li>
                <li>• Usa contexto específico via RAG (Retrieval-Augmented Generation)</li>
                <li>• Gera conteúdo técnico adequado para PT2030</li>
                <li>• Respeita o limite de {charLimit} caracteres</li>
              </ul>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleGenerate}
          disabled={disabled || isGenerating}
          className="w-full bg-pt-green hover:bg-pt-green/90"
        >
          {isGenerating ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Gerando conteúdo...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Gerar com IA
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIGenerationPanel;
