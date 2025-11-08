import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { SectionVersion } from './VersionHistoryPanel';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RestoreConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  version: SectionVersion | null;
  currentContent: string;
  onConfirm: () => Promise<void>;
}

export const RestoreConfirmDialog: React.FC<RestoreConfirmDialogProps> = ({
  isOpen,
  onClose,
  version,
  currentContent,
  onConfirm,
}) => {
  const [understood, setUnderstood] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleConfirm = async () => {
    if (!understood) return;

    try {
      setIsRestoring(true);
      await onConfirm();
      handleClose();
    } catch (error) {
      console.error('Error restoring version:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClose = () => {
    setUnderstood(false);
    onClose();
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  const getCharDiff = () => {
    if (!version) return 0;
    return version.char_count - currentContent.length;
  };

  if (!version) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Restaurar Versão Anterior?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-2">
            <div className="space-y-2">
              <p>
                Você está prestes a restaurar uma versão criada{' '}
                <strong>{formatTimeAgo(version.created_at)}</strong>.
              </p>

              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {version.char_count} caracteres
                </Badge>
                {getCharDiff() !== 0 && (
                  <Badge
                    variant={getCharDiff() > 0 ? 'default' : 'secondary'}
                    className={getCharDiff() > 0 ? 'bg-green-500' : 'bg-red-500'}
                  >
                    {getCharDiff() > 0 ? '+' : ''}{getCharDiff()} chars
                  </Badge>
                )}
              </div>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <strong>Atenção:</strong> Esta ação irá substituir o conteúdo atual.
                Uma versão do conteúdo atual será salva automaticamente antes da
                restauração.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 rounded-lg border p-4 bg-muted/50">
              <div>
                <p className="text-sm font-medium mb-2">Prévia da versão a restaurar:</p>
                <p className="text-sm text-muted-foreground line-clamp-4 font-mono">
                  {version.content}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="understand"
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked as boolean)}
              />
              <Label
                htmlFor="understand"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Eu entendo que vou perder as alterações atuais
              </Label>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isRestoring}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!understood || isRestoring}
            className="bg-primary"
          >
            {isRestoring ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Restaurando...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Restaurar
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
