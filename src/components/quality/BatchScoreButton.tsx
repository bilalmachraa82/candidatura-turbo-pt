import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { batchScoreProject, BatchScoreCallback } from '@/lib/batchScoring';
import { useToast } from '@/hooks/use-toast';

interface BatchScoreButtonProps {
  projectId: string;
  onComplete?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function BatchScoreButton({
  projectId,
  onComplete,
  variant = 'outline',
  size = 'default',
}: BatchScoreButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    current: null as string | null,
  });
  const [result, setResult] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);

  const { toast } = useToast();

  const handleBatchScore = async () => {
    setIsScoring(true);
    setResult(null);
    setProgress({ total: 0, completed: 0, current: null });

    try {
      const progressCallback: BatchScoreCallback = (prog) => {
        setProgress({
          total: prog.total,
          completed: prog.completed,
          current: prog.current,
        });
      };

      const res = await batchScoreProject(projectId, progressCallback);

      setResult({
        total: res.total,
        successful: res.successful,
        failed: res.failed,
      });

      if (res.successful > 0) {
        toast({
          title: 'Avaliação concluída',
          description: `${res.successful} de ${res.total} secções avaliadas com sucesso.`,
        });
      }

      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      console.error('Error in batch scoring:', error);
      toast({
        variant: 'destructive',
        title: 'Erro na avaliação',
        description: error.message || 'Não foi possível avaliar as secções.',
      });
    } finally {
      setIsScoring(false);
    }
  };

  const handleClose = () => {
    if (!isScoring) {
      setIsOpen(false);
      setResult(null);
      setProgress({ total: 0, completed: 0, current: null });
    }
  };

  const progressPercentage = progress.total > 0
    ? (progress.completed / progress.total) * 100
    : 0;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Avaliar Todas as Secções
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliação em Lote</DialogTitle>
            <DialogDescription>
              {isScoring
                ? 'A avaliar qualidade de todas as secções...'
                : result
                  ? 'Avaliação concluída'
                  : 'Avaliar a qualidade de todas as secções com conteúdo.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isScoring && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Progresso: {progress.completed} / {progress.total}
                    </span>
                    <span className="font-medium">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <Progress value={progressPercentage} />
                </div>

                {progress.current && (
                  <div className="flex items-center gap-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-pt-blue" />
                    <span className="text-muted-foreground">
                      A avaliar: <span className="font-medium">{progress.current}</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {!isScoring && !result && (
              <Alert>
                <AlertDescription>
                  Esta operação irá avaliar a qualidade de todas as secções com conteúdo
                  (mínimo 100 caracteres). Pode demorar alguns minutos dependendo do número
                  de secções.
                </AlertDescription>
              </Alert>
            )}

            {!isScoring && result && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Avaliação concluída!</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total de secções:</span>
                    <span className="font-medium">{result.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Avaliadas com sucesso:</span>
                    <span className="font-medium text-green-600">{result.successful}</span>
                  </div>
                  {result.failed > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Com erros:</span>
                      <span className="font-medium text-red-600">{result.failed}</span>
                    </div>
                  )}
                </div>

                {result.failed > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Algumas secções não puderam ser avaliadas. Verifique o conteúdo e tente
                      novamente.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {!isScoring && !result && (
              <>
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleBatchScore}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Iniciar Avaliação
                </Button>
              </>
            )}

            {!isScoring && result && (
              <Button onClick={handleClose}>Fechar</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
