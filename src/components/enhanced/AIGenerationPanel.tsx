
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Brain, Zap, AlertCircle, Radio, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateSection } from '@/lib/generateSection';
import { useStreamingGeneration } from '@/hooks/useStreamingGeneration';
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
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const { toast } = useToast();

  // Streaming hook
  const {
    text: streamedText,
    isStreaming,
    error: streamError,
    sources: streamSources,
    charsUsed,
    generateStream,
    cancelStream,
    reset: resetStream
  } = useStreamingGeneration();

  // Update parent component when streaming completes
  useEffect(() => {
    if (!isStreaming && streamedText && streamingEnabled) {
      onGenerated(streamedText, streamSources);
    }
  }, [isStreaming, streamedText, streamSources, streamingEnabled, onGenerated]);

  // Handle streaming errors
  useEffect(() => {
    if (streamError) {
      toast({
        variant: "destructive",
        title: "Erro na geração",
        description: streamError,
      });
    }
  }, [streamError, toast]);

  const handleGenerate = async () => {
    if (streamingEnabled) {
      // Use streaming mode
      resetStream();
      await generateStream({
        projectId,
        sectionKey,
        charLimit,
        model: selectedModel.id
      });
    } else {
      // Use traditional mode
      setIsGenerating(true);

      try {
        const result = await generateSection(
          projectId,
          sectionKey,
          charLimit,
          'openrouter',
          selectedModel.id
        );

        onGenerated(result.text || '', result.sources || []);
        toast({
          title: "Conteúdo gerado com sucesso",
          description: `${result.charsUsed} caracteres gerados usando ${selectedModel.id.split('/').pop()}`,
        });
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
    }
  };

  const handleCancelStream = () => {
    cancelStream();
    toast({
      title: "Geração cancelada",
      description: "A geração de texto foi interrompida",
    });
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
              disabled={isGenerating || isStreaming}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Idioma</label>
            <Select value={language} onValueChange={setLanguage} disabled={isGenerating || isStreaming}>
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

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Radio className={`h-4 w-4 ${streamingEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            <Label htmlFor="streaming-mode" className="text-sm font-medium cursor-pointer">
              Modo Streaming (texto em tempo real)
            </Label>
          </div>
          <Switch
            id="streaming-mode"
            checked={streamingEnabled}
            onCheckedChange={setStreamingEnabled}
            disabled={isGenerating || isStreaming}
          />
        </div>

        {isStreaming && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <span className="text-sm font-medium text-green-800">Gerando texto em tempo real...</span>
              </div>
              <span className="text-xs text-green-600 font-mono">
                {charsUsed} / {charLimit} caracteres
              </span>
            </div>
            <div className="max-h-32 overflow-y-auto bg-white rounded p-2 text-sm text-gray-700 whitespace-pre-wrap">
              {streamedText || 'Aguardando resposta...'}
            </div>
          </div>
        )}

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
                {streamingEnabled && <li className="text-green-700 font-medium">• Streaming: veja o texto sendo gerado palavra por palavra</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={disabled || isGenerating || isStreaming}
            className="flex-1 bg-pt-green hover:bg-pt-green/90"
          >
            {(isGenerating || isStreaming) ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {streamingEnabled ? 'Gerando com streaming...' : 'Gerando conteúdo...'}
              </>
            ) : (
              <>
                {streamingEnabled ? <Radio className="mr-2 h-4 w-4" /> : <Zap className="mr-2 h-4 w-4" />}
                Gerar com IA
              </>
            )}
          </Button>

          {isStreaming && (
            <Button
              onClick={handleCancelStream}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIGenerationPanel;
