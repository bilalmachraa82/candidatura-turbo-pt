
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Download, Edit3, Save, FileText, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ExportModal from './ExportModal';
import ShareProjectModal from './ShareProjectModal';
import ProjectMembers from './ProjectMembers';
import { useProjectPermissions } from '@/hooks/useProjectPermissions';

interface ProjectHeaderProps {
  project: {
    id: string;
    title: string;
    description?: string;
    organization?: string;
    region?: string;
    budget?: number;
    contact_email?: string;
    contact_phone?: string;
    created_at: string;
    updated_at: string;
    user_id: string;
  };
  isEditing: boolean;
  editedTitle: string;
  editedDescription: string;
  editedOrganization: string;
  editedRegion: string;
  editedBudget: string;
  editedContactEmail: string;
  editedContactPhone: string;
  onEditToggle: () => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onOrganizationChange: (organization: string) => void;
  onRegionChange: (region: string) => void;
  onBudgetChange: (budget: string) => void;
  onContactEmailChange: (email: string) => void;
  onContactPhoneChange: (phone: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  isEditing,
  editedTitle,
  editedDescription,
  editedOrganization,
  editedRegion,
  editedBudget,
  editedContactEmail,
  editedContactPhone,
  onEditToggle,
  onTitleChange,
  onDescriptionChange,
  onOrganizationChange,
  onRegionChange,
  onBudgetChange,
  onContactEmailChange,
  onContactPhoneChange,
  onSave,
  isSaving
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const { toast } = useToast();
  const { permissions } = useProjectPermissions(project.id);

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
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-pt-green focus:outline-none focus:border-pt-green w-full"
                    placeholder="Título do projeto"
                  />
                </div>
                <div>
                  <textarea
                    value={editedDescription}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    className="text-gray-600 bg-transparent border border-gray-300 rounded-md p-2 focus:outline-none focus:border-pt-green w-full resize-none"
                    placeholder="Descrição do projeto (opcional)"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="organization" className="text-sm text-gray-700">Organização</Label>
                    <Input
                      id="organization"
                      type="text"
                      value={editedOrganization}
                      onChange={(e) => onOrganizationChange(e.target.value)}
                      className="mt-1"
                      placeholder="Nome da organização"
                    />
                  </div>
                  <div>
                    <Label htmlFor="region" className="text-sm text-gray-700">Região</Label>
                    <Input
                      id="region"
                      type="text"
                      value={editedRegion}
                      onChange={(e) => onRegionChange(e.target.value)}
                      className="mt-1"
                      placeholder="Região do projeto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget" className="text-sm text-gray-700">Orçamento (€)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={editedBudget}
                      onChange={(e) => onBudgetChange(e.target.value)}
                      className="mt-1"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_email" className="text-sm text-gray-700">Email de Contacto</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={editedContactEmail}
                      onChange={(e) => onContactEmailChange(e.target.value)}
                      className="mt-1"
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_phone" className="text-sm text-gray-700">Telefone de Contacto</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={editedContactPhone}
                      onChange={(e) => onContactPhoneChange(e.target.value)}
                      className="mt-1"
                      placeholder="+351 912 345 678"
                    />
                  </div>
                </div>
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

                {/* Project metadata */}
                {(project.organization || project.region || project.budget || project.contact_email || project.contact_phone) && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    {project.organization && (
                      <div className="text-gray-700">
                        <span className="font-medium">Organização:</span> {project.organization}
                      </div>
                    )}
                    {project.region && (
                      <div className="text-gray-700">
                        <span className="font-medium">Região:</span> {project.region}
                      </div>
                    )}
                    {project.budget && (
                      <div className="text-gray-700">
                        <span className="font-medium">Orçamento:</span> €{project.budget.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                    {project.contact_email && (
                      <div className="text-gray-700">
                        <span className="font-medium">Email:</span> {project.contact_email}
                      </div>
                    )}
                    {project.contact_phone && (
                      <div className="text-gray-700">
                        <span className="font-medium">Telefone:</span> {project.contact_phone}
                      </div>
                    )}
                  </div>
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
                {/* Project Members */}
                <ProjectMembers
                  projectId={project.id}
                  maxVisible={3}
                  onOpenShareModal={() => setShowShareModal(true)}
                />

                {/* Share Button */}
                {permissions.canInviteMembers && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Partilhar
                  </Button>
                )}

                {/* Edit Button */}
                {permissions.canEditProjectSettings && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEditToggle}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}

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

      <ShareProjectModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        projectId={project.id}
        projectName={project.title}
      />
    </>
  );
};

export default ProjectHeader;
