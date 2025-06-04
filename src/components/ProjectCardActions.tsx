
import React, { useState } from 'react';
import { MoreVertical, Edit3, Trash2, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import DeleteProjectDialog from './DeleteProjectDialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectCardActionsProps {
  project: {
    id: string;
    title: string;
  };
  onProjectDeleted: (projectId: string) => void;
  onProjectEdit?: (project: any) => void;
}

const ProjectCardActions: React.FC<ProjectCardActionsProps> = ({
  project,
  onProjectDeleted,
  onProjectEdit
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    
    try {
      // Delete project sections first
      const { error: sectionsError } = await supabase
        .from('sections')
        .delete()
        .eq('project_id', project.id);

      if (sectionsError) {
        throw sectionsError;
      }

      // Delete indexed files
      const { error: filesError } = await supabase
        .from('indexed_files')
        .delete()
        .eq('project_id', project.id);

      if (filesError) {
        console.warn('Error deleting indexed files:', filesError);
      }

      // Delete document chunks
      const { error: chunksError } = await supabase
        .from('document_chunks')
        .delete()
        .eq('project_id', project.id);

      if (chunksError) {
        console.warn('Error deleting document chunks:', chunksError);
      }

      // Delete generations
      const { error: generationsError } = await supabase
        .from('generations')
        .delete()
        .eq('project_id', project.id);

      if (generationsError) {
        console.warn('Error deleting generations:', generationsError);
      }

      // Finally delete the project
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (projectError) {
        throw projectError;
      }

      toast({
        title: "Projeto eliminado",
        description: `O projeto "${project.title}" foi eliminado com sucesso.`
      });

      onProjectDeleted(project.id);
      setShowDeleteDialog(false);

    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        variant: "destructive",
        title: "Erro ao eliminar",
        description: error.message || "Não foi possível eliminar o projeto."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onProjectEdit && (
            <>
              <DropdownMenuItem onClick={() => onProjectEdit(project)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Projeto
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar Projeto
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteProjectDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteProject}
        projectTitle={project.title}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default ProjectCardActions;
