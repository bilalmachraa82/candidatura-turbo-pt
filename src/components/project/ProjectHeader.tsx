
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, Edit3, Save, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ExportModal from './ExportModal';

interface ProjectHeaderProps {
  project: {
    id: string;
    title: string;
    description?: string;
    created_at: string;
    updated_at: string;
    user_id: string;
  };
  isEditing: boolean;
  editedTitle: string;
  editedDescription: string;
  onEditToggle: () => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  isEditing,
  editedTitle,
  editedDescription,
  onEditToggle,
  onTitleChange,
  onDescriptionChange,
  onSave,
  isSaving
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleQuickExport = async () => {
    try {
      // Fazer um quick export em PDF português
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          format: 'pdf',
          language: 'pt'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Simular download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Download iniciado",
          description: "O dossiê está a ser descarregado"
        });
      } else {
        // Se falhar, abrir modal para mais opções
        setShowExportModal(true);
      }
    } catch (error) {
      console.error('Quick export error:', error);
      setShowExportModal(true);
    }
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-pt-green focus:outline-none focus:border-pt-green w-full"
                  placeholder="Título do projeto"
                />
                <textarea
                  value={editedDescription}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  className="text-gray-600 bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:border-pt-green w-full resize-none"
                  placeholder="Descrição do projeto (opcional)"
                  rows={2}
                />
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {project.title}
                </h1>
                {project.description && (
                  <p className="text-gray-600 mt-1 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    Criado em {formatDate(project.created_at)}
                  </div>
                  {project.updated_at !== project.created_at && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Edit3 className="h-4 w-4 mr-1" />
                      Atualizado em {formatDate(project.updated_at)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 ml-4">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEditToggle}
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={onSave}
                  disabled={isSaving || !editedTitle.trim()}
                  className="bg-pt-green hover:bg-pt-green/90"
                >
                  {isSaving ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-spin" />
                      A guardar...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEditToggle}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickExport}
                  className="hidden sm:flex"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>

                <Button
                  size="sm"
                  onClick={() => setShowExportModal(true)}
                  className="bg-pt-green hover:bg-pt-green/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Dossiê
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        projectId={project.id}
        projectTitle={project.title}
      />
    </>
  );
};

export default ProjectHeader;
