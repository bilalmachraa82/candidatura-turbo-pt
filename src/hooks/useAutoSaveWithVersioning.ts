import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface UseAutoSaveWithVersioningProps {
  sectionId: string;
  content: string;
  charLimit: number;
  delay?: number;
  enabled?: boolean;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface VersionMetadata {
  source: 'manual' | 'auto-save' | 'ai-generated' | 'restore';
  aiModel?: string;
  prompt?: string;
  restoredFrom?: string;
  deviceInfo?: string;
}

export const useAutoSaveWithVersioning = ({
  sectionId,
  content,
  charLimit,
  delay = 30000, // 30 seconds
  enabled = true
}: UseAutoSaveWithVersioningProps) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastSavedContent, setLastSavedContent] = useState(content);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const hasUnsavedChanges = content !== lastSavedContent && content.trim() !== '';

  const saveVersion = async (
    contentToSave: string,
    changeSummary: string = 'Auto-save',
    metadata: VersionMetadata = { source: 'auto-save' }
  ) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Update the sections table (current version)
      const { error: updateError } = await supabase
        .from('sections')
        .update({
          content: contentToSave,
          updated_at: new Date().toISOString()
        })
        .eq('id', sectionId);

      if (updateError) throw updateError;

      // Create version snapshot
      const { error: versionError } = await supabase
        .from('section_versions')
        .insert({
          section_id: sectionId,
          content: contentToSave,
          char_count: contentToSave.length,
          change_summary: changeSummary,
          user_id: user?.id,
          metadata: metadata
        });

      if (versionError) throw versionError;

      setLastSaved(new Date());
      setLastSavedContent(contentToSave);
      setSaveStatus('saved');

      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);

      return true;
    } catch (error) {
      console.error('Save error:', error);
      setSaveStatus('error');
      toast({
        variant: "destructive",
        title: "Erro ao guardar",
        description: "Não foi possível guardar o conteúdo. Tente novamente."
      });
      return false;
    }
  };

  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setSaveStatus('idle');

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      await saveVersion(content);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, enabled, hasUnsavedChanges, sectionId, delay]);

  const manualSave = async (changeSummary?: string) => {
    if (!hasUnsavedChanges && !changeSummary) return;

    setSaveStatus('saving');
    return await saveVersion(
      content,
      changeSummary || 'Manual save',
      { source: 'manual' }
    );
  };

  const saveWithMetadata = async (
    contentToSave: string,
    changeSummary: string,
    metadata: VersionMetadata
  ) => {
    setSaveStatus('saving');
    return await saveVersion(contentToSave, changeSummary, metadata);
  };

  return {
    saveStatus,
    lastSaved,
    hasUnsavedChanges,
    manualSave,
    saveWithMetadata
  };
};
