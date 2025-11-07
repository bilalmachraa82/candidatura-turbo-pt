
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProgressDashboard from './ProgressDashboard';
import ProgressChecklist from './ProgressChecklist';
import { calculateProgress, ProjectProgress } from '@/lib/progressCalculator';
import { ProjectSection, UploadedFile } from '@/types/components';
import { Database } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Project = Database['public']['Tables']['projects']['Row'];
type IndexedFile = Database['public']['Tables']['indexed_files']['Row'];

interface ProgressTabProps {
  project: Project | null;
  sections: ProjectSection[];
  files: UploadedFile[];
  onExport?: () => void;
  isExporting?: boolean;
}

// Convert UploadedFile to IndexedFile format for progress calculation
function convertToIndexedFiles(files: UploadedFile[]): IndexedFile[] {
  return files.map(file => ({
    id: file.id,
    project_id: '',  // Will be set by calculateProgress
    file_name: file.name,
    file_url: file.url,
    file_type: file.type,
    category: file.category || null,
    created_at: file.uploadDate || null,
    updated_at: null,
    status: 'indexed',
    error_message: null,
    file_size: null,
    storage_bucket: null,
    storage_path: null
  }));
}

const ProgressTab: React.FC<ProgressTabProps> = ({
  project,
  sections,
  files,
  onExport,
  isExporting = false
}) => {
  const [progress, setProgress] = useState<ProjectProgress | null>(null);
  const [checklistOverrides, setChecklistOverrides] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Load checklist overrides from database
  useEffect(() => {
    if (project?.id) {
      loadChecklistOverrides();
    }
  }, [project?.id]);

  // Recalculate progress when dependencies change
  useEffect(() => {
    if (project) {
      const indexedFiles = convertToIndexedFiles(files);
      const calculated = calculateProgress(project, sections, indexedFiles, checklistOverrides);
      setProgress(calculated);
    }
  }, [project, sections, files, checklistOverrides]);

  const loadChecklistOverrides = async () => {
    if (!project?.id) return;

    try {
      const { data, error } = await supabase
        .from('checklist_items')
        .select('item_id, checked')
        .eq('project_id', project.id);

      if (error) throw error;

      if (data) {
        const overrides: Record<string, boolean> = {};
        data.forEach(item => {
          overrides[item.item_id] = item.checked;
        });
        setChecklistOverrides(overrides);
      }
    } catch (error) {
      console.error('Error loading checklist overrides:', error);
      // Don't show error toast, just log it
    }
  };

  const handleCheckToggle = async (itemId: string, checked: boolean) => {
    if (!project?.id) return;

    try {
      // Update in database
      const { data: existing } = await supabase
        .from('checklist_items')
        .select('id')
        .eq('project_id', project.id)
        .eq('item_id', itemId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('checklist_items')
          .update({
            checked,
            checked_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('checklist_items')
          .insert({
            project_id: project.id,
            item_id: itemId,
            checked,
            checked_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Update local state
      setChecklistOverrides(prev => ({
        ...prev,
        [itemId]: checked
      }));

      toast({
        title: checked ? 'Item marcado' : 'Item desmarcado',
        description: 'Checklist atualizada com sucesso'
      });
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar o checklist'
      });
    }
  };

  const handleActionClick = (link: string) => {
    // Navigate to the linked tab or action
    // This could be expanded to handle different link types
    if (link === 'documents') {
      // Trigger document tab navigation
      const event = new CustomEvent('navigate-to-tab', { detail: { tab: 'documents' } });
      window.dispatchEvent(event);
    } else if (link === 'export' && onExport) {
      onExport();
    }
  };

  if (!progress) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">A calcular progresso...</div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        <TabsTrigger value="checklist">Checklist</TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-6">
        <ProgressDashboard
          progress={progress}
          onExport={onExport}
          isExporting={isExporting}
        />
      </TabsContent>

      <TabsContent value="checklist">
        <ProgressChecklist
          checklist={progress.checklist}
          onCheckToggle={handleCheckToggle}
          onActionClick={handleActionClick}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ProgressTab;
