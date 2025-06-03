
import { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseAutoSaveProps {
  data: string;
  onSave: (data: string) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export const useAutoSave = ({ data, onSave, delay = 2000, enabled = true }: UseAutoSaveProps) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedData, setLastSavedData] = useState(data);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const hasUnsavedChanges = data !== lastSavedData && data.trim() !== '';

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
      try {
        setSaveStatus('saving');
        await onSave(data);
        setLastSavedData(data);
        setSaveStatus('saved');
        
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveStatus('error');
        toast({
          variant: "destructive",
          title: "Erro ao guardar",
          description: "Não foi possível guardar automaticamente. Tente guardar manualmente."
        });
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, hasUnsavedChanges, onSave, delay, toast]);

  const manualSave = async () => {
    if (!hasUnsavedChanges) return;
    
    try {
      setSaveStatus('saving');
      await onSave(data);
      setLastSavedData(data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      throw error;
    }
  };

  return {
    saveStatus,
    hasUnsavedChanges,
    manualSave
  };
};
