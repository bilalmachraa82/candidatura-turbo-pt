import React, { useMemo } from 'react';
import { diff_match_patch, DIFF_DELETE, DIFF_INSERT, DIFF_EQUAL } from 'diff-match-patch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { SectionVersion } from './VersionHistoryPanel';

interface VersionDiffViewerProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
  version: SectionVersion | null;
  onRestore: () => void;
}

export const VersionDiffViewer: React.FC<VersionDiffViewerProps> = ({
  isOpen,
  onClose,
  currentContent,
  version,
  onRestore,
}) => {
  const dmp = useMemo(() => new diff_match_patch(), []);

  const diffResults = useMemo(() => {
    if (!version) return null;

    const diffs = dmp.diff_main(version.content, currentContent);
    dmp.diff_cleanupSemantic(diffs);

    let charsAdded = 0;
    let charsRemoved = 0;
    let wordsAdded = 0;
    let wordsRemoved = 0;

    diffs.forEach(([type, text]) => {
      const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

      if (type === DIFF_INSERT) {
        charsAdded += text.length;
        wordsAdded += wordCount;
      } else if (type === DIFF_DELETE) {
        charsRemoved += text.length;
        wordsRemoved += wordCount;
      }
    });

    return {
      diffs,
      charsAdded,
      charsRemoved,
      wordsAdded,
      wordsRemoved,
      charsDiff: charsAdded - charsRemoved,
      wordsDiff: wordsAdded - wordsRemoved,
    };
  }, [version, currentContent, dmp]);

  const renderUnifiedDiff = () => {
    if (!diffResults) return null;

    return (
      <div className="font-mono text-sm whitespace-pre-wrap break-words">
        {diffResults.diffs.map(([type, text], index) => {
          if (type === DIFF_EQUAL) {
            return (
              <span key={index} className="text-foreground">
                {text}
              </span>
            );
          } else if (type === DIFF_INSERT) {
            return (
              <span
                key={index}
                className="bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100"
              >
                {text}
              </span>
            );
          } else {
            return (
              <span
                key={index}
                className="bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 line-through"
              >
                {text}
              </span>
            );
          }
        })}
      </div>
    );
  };

  const renderSideBySide = () => {
    if (!version) return null;

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 pb-2 border-b">
            <Badge variant="outline">Versão Anterior</Badge>
            <Badge variant="secondary">{version.char_count} chars</Badge>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="font-mono text-sm whitespace-pre-wrap break-words pr-4">
              {version.content}
            </div>
          </ScrollArea>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2 pb-2 border-b">
            <Badge variant="outline">Versão Atual</Badge>
            <Badge variant="secondary">{currentContent.length} chars</Badge>
          </div>
          <ScrollArea className="h-[400px]">
            <div className="font-mono text-sm whitespace-pre-wrap break-words pr-4">
              {currentContent}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  if (!version || !diffResults) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Comparação de Versões
          </DialogTitle>
          <DialogDescription>
            Compare as diferenças entre a versão selecionada e a versão atual
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-1 text-sm font-medium">
                {diffResults.charsDiff > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : diffResults.charsDiff < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : null}
                <span className={
                  diffResults.charsDiff > 0 ? 'text-green-600 dark:text-green-400' :
                  diffResults.charsDiff < 0 ? 'text-red-600 dark:text-red-400' :
                  'text-muted-foreground'
                }>
                  {diffResults.charsDiff > 0 ? '+' : ''}{diffResults.charsDiff}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Caracteres</p>
            </div>

            <div className="flex flex-col items-center p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-1 text-sm font-medium">
                {diffResults.wordsDiff > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : diffResults.wordsDiff < 0 ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : null}
                <span className={
                  diffResults.wordsDiff > 0 ? 'text-green-600 dark:text-green-400' :
                  diffResults.wordsDiff < 0 ? 'text-red-600 dark:text-red-400' :
                  'text-muted-foreground'
                }>
                  {diffResults.wordsDiff > 0 ? '+' : ''}{diffResults.wordsDiff}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Palavras</p>
            </div>

            <div className="flex flex-col items-center p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                +{diffResults.charsAdded}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Adicionado</p>
            </div>

            <div className="flex flex-col items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                -{diffResults.charsRemoved}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Removido</p>
            </div>
          </div>

          <Separator />

          {/* Diff views */}
          <Tabs defaultValue="unified" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unified">Vista Unificada</TabsTrigger>
              <TabsTrigger value="split">Lado a Lado</TabsTrigger>
            </TabsList>

            <TabsContent value="unified" className="mt-4">
              <ScrollArea className="h-[400px] rounded-md border p-4">
                {renderUnifiedDiff()}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="split" className="mt-4">
              {renderSideBySide()}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={onRestore}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar esta versão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
