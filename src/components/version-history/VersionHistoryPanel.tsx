import React, { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  User,
  Sparkles,
  Edit,
  RotateCcw,
  FileText,
  Calendar,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { VersionMetadata } from '@/hooks/useAutoSaveWithVersioning';

export interface SectionVersion {
  id: string;
  section_id: string;
  content: string;
  char_count: number;
  change_summary: string | null;
  user_id: string | null;
  created_at: string;
  metadata: VersionMetadata | null;
}

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  onViewDiff: (versionId: string, version: SectionVersion) => void;
  onRestore: (versionId: string, version: SectionVersion) => void;
}

export const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  isOpen,
  onClose,
  sectionId,
  onViewDiff,
  onRestore,
}) => {
  const [versions, setVersions] = useState<SectionVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (isOpen && sectionId) {
      loadVersions();
    }
  }, [isOpen, sectionId]);

  const loadVersions = async (loadMore = false) => {
    try {
      setLoading(true);
      const currentPage = loadMore ? page + 1 : 0;
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from('section_versions')
        .select('*')
        .eq('section_id', sectionId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (loadMore) {
        setVersions([...versions, ...(data || [])]);
      } else {
        setVersions(data || []);
      }

      setHasMore((data || []).length === pageSize);
      setPage(currentPage);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVersionIcon = (metadata: VersionMetadata | null) => {
    if (!metadata) return <Edit className="h-4 w-4" />;

    switch (metadata.source) {
      case 'ai-generated':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      case 'restore':
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      case 'manual':
        return <Edit className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSourceLabel = (metadata: VersionMetadata | null) => {
    if (!metadata) return 'Manual';

    switch (metadata.source) {
      case 'ai-generated':
        return 'IA';
      case 'restore':
        return 'Restaurado';
      case 'manual':
        return 'Manual';
      case 'auto-save':
        return 'Auto-save';
      default:
        return 'Manual';
    }
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

  const getPreview = (content: string, maxLength = 100) => {
    if (!content) return 'Sem conteúdo';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg w-full">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Histórico de Versões
          </SheetTitle>
          <SheetDescription>
            Visualize e restaure versões anteriores do conteúdo
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-4">
            {versions.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma versão encontrada
                </p>
              </div>
            )}

            {versions.map((version, index) => (
              <div key={version.id} className="relative">
                {/* Timeline connector */}
                {index < versions.length - 1 && (
                  <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border" />
                )}

                <div className="flex gap-4">
                  {/* Timeline dot */}
                  <div className="flex-shrink-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-muted">
                      {getVersionIcon(version.metadata)}
                    </div>
                  </div>

                  {/* Version content */}
                  <div className="flex-1 space-y-2 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {getSourceLabel(version.metadata)}
                          </Badge>
                          {version.metadata?.aiModel && (
                            <Badge variant="secondary" className="text-xs">
                              {version.metadata.aiModel}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatTimeAgo(version.created_at)}
                        </p>
                      </div>

                      <Badge variant="secondary" className="text-xs">
                        {version.char_count} chars
                      </Badge>
                    </div>

                    {version.change_summary && (
                      <p className="text-sm font-medium">
                        {version.change_summary}
                      </p>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {getPreview(version.content)}
                    </p>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDiff(version.id, version)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Ver Diferenças
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onRestore(version.id, version)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Restaurar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && !loading && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => loadVersions(true)}
              >
                Carregar mais versões
              </Button>
            )}

            {loading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
