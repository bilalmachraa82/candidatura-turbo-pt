
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles, Clock, Save, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AIGenerationPanel from './AIGenerationPanel';
import { QualityPanel } from '@/components/quality/QualityPanel';
import { useQualityScore } from '@/hooks/useQualityScore';
import { ProjectSection } from '@/types/components';
import { useAutoSaveWithVersioning } from '@/hooks/useAutoSaveWithVersioning';
import { VersionHistoryPanel, SectionVersion } from '@/components/version-history/VersionHistoryPanel';
import { VersionDiffViewer } from '@/components/version-history/VersionDiffViewer';
import { RestoreConfirmDialog } from '@/components/version-history/RestoreConfirmDialog';
import { analytics } from '@/lib/analytics';
import { useToast } from '@/hooks/use-toast';

interface EnhancedSectionEditorProps {
  section: ProjectSection;
  projectId: string;
  onTextChange: (sectionId: string, text: string) => void;
  onSourcesUpdate?: (sectionId: string, sources: any[]) => void;
  readOnly?: boolean;
}

const EnhancedSectionEditor: React.FC<EnhancedSectionEditorProps> = ({
  section,
  projectId,
  onTextChange,
  onSourcesUpdate,
  readOnly = false
}) => {
  const [text, setText] = useState(section.content);
  const [sources, setSources] = useState<any[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aiPanelRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Version history state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDiffViewerOpen, setIsDiffViewerOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<SectionVersion | null>(null);

  // Auto-save with versioning
  const { saveStatus, lastSaved, hasUnsavedChanges, manualSave, saveWithMetadata } = useAutoSaveWithVersioning({
    sectionId: section.id,
    content: text,
    charLimit: section.charLimit,
    delay: 30000, // 30 seconds
    enabled: true,
  });

  // Quality scoring
  const { score, isScoring, error, reScore } = useQualityScore({
    sectionId: section.id,
    content: text,
    enabled: true,
    debounceDelay: 3000,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+H or Ctrl+H - Open version history
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        handleOpenHistory();
      }

      // Cmd+Shift+Z or Ctrl+Shift+Z - Quick restore (restore previous version)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        // This would need to fetch the most recent version
        toast({
          title: "Restaurar versão anterior",
          description: "Abra o histórico de versões para restaurar uma versão específica.",
        });
        handleOpenHistory();
      }

      // Cmd+S or Ctrl+S - Manual save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(section.id, newText);
  };

  const handleAIGeneration = useCallback(async (generatedText: string, generatedSources: any[]) => {
    setText(generatedText);
    setSources(generatedSources);
    onTextChange(section.id, generatedText);
    if (onSourcesUpdate) {
      onSourcesUpdate(section.id, generatedSources);
    }

    // Save AI-generated content with metadata
    await saveWithMetadata(
      generatedText,
      'AI generated content',
      {
        source: 'ai-generated',
        aiModel: 'OpenRouter', // You can get this from the AI context
      }
    );
  }, [section.id, onTextChange, onSourcesUpdate, saveWithMetadata]);

  const handleManualSave = async () => {
    await manualSave('Manual save');
    toast({
      title: "Guardado",
      description: "O conteúdo foi guardado com sucesso.",
    });
  };

  const handleOpenHistory = () => {
    setIsHistoryOpen(true);
    analytics.versionHistoryOpened(section.id);
  };

  const handleViewDiff = (versionId: string, version: SectionVersion) => {
    setSelectedVersion(version);
    setIsDiffViewerOpen(true);

    const timeAgo = formatDistanceToNow(new Date(version.created_at), {
      addSuffix: true,
      locale: ptBR
    });

    analytics.versionCompared(
      section.id,
      versionId
    );
  };

  const handleRestoreClick = (versionId: string, version: SectionVersion) => {
    setSelectedVersion(version);
    setIsRestoreDialogOpen(true);
  };

  const handleRestoreConfirm = async () => {
    if (!selectedVersion) return;

    try {
      // Save current content as a version before restoring
      await saveWithMetadata(
        text,
        'Pre-restore snapshot',
        { source: 'manual' }
      );

      // Update content with the restored version
      setText(selectedVersion.content);
      onTextChange(section.id, selectedVersion.content);

      // Save the restored content as a new version
      await saveWithMetadata(
        selectedVersion.content,
        'Restored from previous version',
        {
          source: 'restore',
          restoredFrom: selectedVersion.id,
        }
      );

      const timeAgo = formatDistanceToNow(new Date(selectedVersion.created_at), {
        addSuffix: true,
        locale: ptBR
      });

      analytics.versionRestored(
        section.id,
        selectedVersion.id,
        timeAgo
      );

      toast({
        title: "Versão restaurada",
        description: `O conteúdo foi restaurado para a versão de ${timeAgo}.`,
      });

      // Close all dialogs
      setIsRestoreDialogOpen(false);
      setIsDiffViewerOpen(false);
      setIsHistoryOpen(false);
    } catch (error) {
      console.error('Error restoring version:', error);
      toast({
        variant: "destructive",
        title: "Erro ao restaurar",
        description: "Não foi possível restaurar a versão. Tente novamente.",
      });
    }
  };

  const charCount = text.length;
  const charLimit = section.charLimit;
  const progressPercentage = (charCount / charLimit) * 100;
  const isOverLimit = charCount > charLimit;

  const getProgressColor = () => {
    if (progressPercentage <= 60) return 'bg-green-500';
    if (progressPercentage <= 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    try {
      return formatDistanceToNow(lastSaved, {
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg text-pt-blue">{section.title}</CardTitle>
              <CardDescription className="mt-1">{section.description}</CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenHistory}
                    title="Histórico de versões (Cmd+H)"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Histórico
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualSave}
                    disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                    title="Guardar manualmente (Cmd+S)"
                  >
                    {saveStatus === 'saving' ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-1" />
                    )}
                    Guardar
                  </Button>
                </div>
              )}
              <Badge variant={isOverLimit ? "destructive" : "secondary"}>
                {charCount}/{charLimit} caracteres
              </Badge>
              {sources.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {sources.length} fonte{sources.length !== 1 ? 's' : ''} usada{sources.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {lastSaved && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {saveStatus === 'saving' && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  <span>
                    {saveStatus === 'saving'
                      ? 'A guardar...'
                      : `Guardado ${formatLastSaved()}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progresso do conteúdo</span>
              <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-gray-600'}>
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress
              value={Math.min(progressPercentage, 100)}
              className={`h-2 ${getProgressColor()}`}
            />
          </div>

          {text.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6 border rounded-lg bg-muted/30">
              <FileText className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm mb-4">
                Esta secção está vazia. Comece a escrever ou gere conteúdo com IA.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => textareaRef.current?.focus()}
                >
                  Escrever Manualmente
                </Button>
                <Button
                  size="sm"
                  onClick={() => aiPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar com IA
                </Button>
              </div>
            </div>
          ) : null}

          <Textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            placeholder={`Escreva o conteúdo para ${section.title}...`}
            className={`min-h-[200px] resize-y ${isOverLimit ? 'border-red-300 focus:border-red-500' : ''} ${text.length === 0 ? 'sr-only' : ''}`}
            maxLength={charLimit + 500} // Allow slight overflow for editing
            readOnly={readOnly}
            disabled={readOnly}
          />

          {isOverLimit && (
            <p className="text-sm text-red-600">
              ⚠️ O texto excede o limite de caracteres em {charCount - charLimit} caracteres.
            </p>
          )}

          {sources.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Fontes utilizadas:</h4>
              <div className="space-y-1">
                {sources.map((source, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-pt-green rounded-full"></span>
                    <span className="font-medium">{source.name}</span>
                    <span>- {source.reference}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <QualityPanel
        score={score}
        isScoring={isScoring}
        error={error}
        onReScore={reScore}
        sectionId={section.id}
      />

      {!readOnly && (
        <div ref={aiPanelRef}>
          <AIGenerationPanel
            projectId={projectId}
            sectionKey={section.key}
            sectionTitle={section.title}
            charLimit={charLimit}
            onGenerated={handleAIGeneration}
            disabled={false}
          />
        </div>
      )}

      {/* Version History Panel */}
      <VersionHistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sectionId={section.id}
        onViewDiff={handleViewDiff}
        onRestore={handleRestoreClick}
      />

      {/* Version Diff Viewer */}
      <VersionDiffViewer
        isOpen={isDiffViewerOpen}
        onClose={() => setIsDiffViewerOpen(false)}
        currentContent={text}
        version={selectedVersion}
        onRestore={() => {
          setIsDiffViewerOpen(false);
          setIsRestoreDialogOpen(true);
        }}
      />

      {/* Restore Confirm Dialog */}
      <RestoreConfirmDialog
        isOpen={isRestoreDialogOpen}
        onClose={() => setIsRestoreDialogOpen(false)}
        version={selectedVersion}
        currentContent={text}
        onConfirm={handleRestoreConfirm}
      />
    </div>
  );
};

export default EnhancedSectionEditor;
