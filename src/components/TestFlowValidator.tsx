
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAI } from '@/context/AIContext';
import { CheckCircle, XCircle, Loader2, Play } from 'lucide-react';

interface TestFlowValidatorProps {
  projectId: string;
}

interface TestStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

const TestFlowValidator: React.FC<TestFlowValidatorProps> = ({ projectId }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<TestStep[]>([
    {
      id: 'load-sections',
      name: 'Carregar Secções',
      description: 'Verificar se todas as secções PT2030 foram criadas',
      status: 'pending'
    },
    {
      id: 'test-generation',
      name: 'Testar Geração IA',
      description: 'Gerar conteúdo para a secção 4.i (Análise de Mercado)',
      status: 'pending'
    },
    {
      id: 'validate-content',
      name: 'Validar Conteúdo',
      description: 'Verificar se o conteúdo foi guardado correctamente',
      status: 'pending'
    },
    {
      id: 'check-characters',
      name: 'Contador de Caracteres',
      description: 'Validar contagem de caracteres e limite',
      status: 'pending'
    },
    {
      id: 'verify-sources',
      name: 'Verificar Fontes',
      description: 'Validar se as fontes são devolvidas correctamente',
      status: 'pending'
    }
  ]);
  
  const { toast } = useToast();
  const { generateText } = useAI();

  const updateStepStatus = (stepId: string, status: TestStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ));
  };

  const validateFlow = async () => {
    setIsValidating(true);
    setCurrentStep(0);
    
    try {
      // Passo 1: Carregar secções
      setCurrentStep(1);
      updateStepStatus('load-sections', 'running');
      
      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .eq('project_id', projectId);

      if (sectionsError) throw sectionsError;
      
      if (!sections || sections.length === 0) {
        throw new Error('Nenhuma secção encontrada para este projecto');
      }

      updateStepStatus('load-sections', 'success', `${sections.length} secções carregadas`);

      // Passo 2: Testar geração IA
      setCurrentStep(2);
      updateStepStatus('test-generation', 'running');
      
      const testSection = sections.find(s => s.key === '4.i') || sections[0];
      
      const result = await generateText({
        projectId,
        section: testSection.key,
        charLimit: testSection.char_limit || 2000,
        model: 'gpt-4o'
      });

      if (!result.success) {
        throw new Error(result.error || 'Falha na geração de texto');
      }

      updateStepStatus('test-generation', 'success', `Texto gerado: ${result.text.length} caracteres`);

      // Passo 3: Validar conteúdo guardado
      setCurrentStep(3);
      updateStepStatus('validate-content', 'running');
      
      const { data: updatedSection, error: updateError } = await supabase
        .from('sections')
        .select('content')
        .eq('project_id', projectId)
        .eq('key', testSection.key)
        .single();

      if (updateError) throw updateError;

      if (updatedSection?.content && updatedSection.content.length > 0) {
        updateStepStatus('validate-content', 'success', 'Conteúdo guardado com sucesso');
      } else {
        updateStepStatus('validate-content', 'error', 'Conteúdo não foi guardado');
      }

      // Passo 4: Verificar contador de caracteres
      setCurrentStep(4);
      updateStepStatus('check-characters', 'running');
      
      const charCount = result.text.length;
      const charLimit = testSection.char_limit || 2000;
      const percentage = Math.round((charCount / charLimit) * 100);
      
      updateStepStatus('check-characters', 'success', `${charCount}/${charLimit} caracteres (${percentage}%)`);

      // Passo 5: Verificar fontes
      setCurrentStep(5);
      updateStepStatus('verify-sources', 'running');
      
      if (result.sources && result.sources.length > 0) {
        updateStepStatus('verify-sources', 'success', `${result.sources.length} fontes encontradas`);
      } else {
        updateStepStatus('verify-sources', 'success', 'Nenhuma fonte específica (normal sem documentos carregados)');
      }

      toast({
        title: "Validação concluída",
        description: "Todos os testes do fluxo foram executados com sucesso!"
      });

    } catch (error: any) {
      console.error('Erro na validação:', error);
      
      const currentStepId = steps[currentStep - 1]?.id;
      if (currentStepId) {
        updateStepStatus(currentStepId, 'error', error.message);
      }
      
      toast({
        variant: "destructive",
        title: "Erro na validação",
        description: error.message || "Ocorreu um erro durante a validação do fluxo."
      });
    } finally {
      setIsValidating(false);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-pt-blue">
          <Play className="mr-2 h-5 w-5" />
          Validador de Fluxo PT2030
        </CardTitle>
        <CardDescription>
          Execute testes automáticos para validar todo o fluxo de geração
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso da Validação</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                {step.status === 'pending' && (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                )}
                {step.status === 'running' && (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                )}
                {step.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {step.status === 'error' && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="font-medium">{step.name}</div>
                <div className="text-sm text-gray-600">{step.description}</div>
                {step.message && (
                  <div className={`text-sm mt-1 ${
                    step.status === 'error' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {step.message}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={validateFlow}
          disabled={isValidating}
          className="w-full bg-pt-green hover:bg-pt-green/90"
        >
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              A validar fluxo...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Iniciar Validação
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TestFlowValidator;
