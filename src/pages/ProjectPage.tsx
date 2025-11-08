
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import SidebarPanel from '@/components/SidebarPanel';
import { useProject } from '@/hooks/use-project';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProjectHeader from '@/components/project/ProjectHeader';
import ContentTab from '@/components/project/ContentTab';
import DocumentsTab from '@/components/project/DocumentsTab';
import ProgressTab from '@/components/project/ProgressTab';

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedOrganization, setEditedOrganization] = useState('');
  const [editedRegion, setEditedRegion] = useState('');
  const [editedBudget, setEditedBudget] = useState<string>('');
  const [editedContactEmail, setEditedContactEmail] = useState('');
  const [editedContactPhone, setEditedContactPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const {
    project,
    files,
    sections,
    sources,
    charsUsed,
    totalCharLimit,
    isLoading,
    isExporting,
    setIsExporting,
    handleFileUploaded,
    handleSectionTextChange,
    handleSourcesUpdate,
    refetchProject
  } = useProject({ projectId });

  React.useEffect(() => {
    if (project && !isEditing) {
      setEditedTitle(project.title || '');
      setEditedDescription(project.description || '');
      setEditedOrganization(project.organization || '');
      setEditedRegion(project.region || '');
      setEditedBudget(project.budget?.toString() || '');
      setEditedContactEmail(project.contact_email || '');
      setEditedContactPhone(project.contact_phone || '');
    }
  }, [project, isEditing]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset values when canceling
      setEditedTitle(project?.title || '');
      setEditedDescription(project?.description || '');
      setEditedOrganization(project?.organization || '');
      setEditedRegion(project?.region || '');
      setEditedBudget(project?.budget?.toString() || '');
      setEditedContactEmail(project?.contact_email || '');
      setEditedContactPhone(project?.contact_phone || '');
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!project || !editedTitle.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "O título do projeto é obrigatório"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Parse budget to number if provided
      const budgetValue = editedBudget.trim() ? parseFloat(editedBudget) : null;

      // Validate budget is a valid number if provided
      if (editedBudget.trim() && (isNaN(budgetValue!) || budgetValue! < 0)) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "O orçamento deve ser um número válido"
        });
        setIsSaving(false);
        return;
      }

      // Update project in database
      const { error } = await supabase
        .from('projects')
        .update({
          title: editedTitle.trim(),
          description: editedDescription.trim() || null,
          organization: editedOrganization.trim() || null,
          region: editedRegion.trim() || null,
          budget: budgetValue,
          contact_email: editedContactEmail.trim() || null,
          contact_phone: editedContactPhone.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (error) throw error;

      // Show success toast
      toast({
        title: "Sucesso!",
        description: "Projeto atualizado com sucesso"
      });

      // Refetch project data to update UI
      await refetchProject();

      setIsEditing(false);
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar projeto",
        description: error.message || "Ocorreu um erro ao atualizar o projeto. Tente novamente."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast({
        title: "Exportação concluída",
        description: "O documento foi exportado com sucesso"
      });
    }, 2000);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="pt-container pt-section">
          <p>Carregando projeto...</p>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="pt-container pt-section">
          <p>Projeto não encontrado</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pt-container pt-section">
        <ProjectHeader
          project={project}
          isEditing={isEditing}
          editedTitle={editedTitle}
          editedDescription={editedDescription}
          editedOrganization={editedOrganization}
          editedRegion={editedRegion}
          editedBudget={editedBudget}
          editedContactEmail={editedContactEmail}
          editedContactPhone={editedContactPhone}
          onEditToggle={handleEditToggle}
          onTitleChange={setEditedTitle}
          onDescriptionChange={setEditedDescription}
          onOrganizationChange={setEditedOrganization}
          onRegionChange={setEditedRegion}
          onBudgetChange={setEditedBudget}
          onContactEmailChange={setEditedContactEmail}
          onContactPhoneChange={setEditedContactPhone}
          onSave={handleSave}
          isSaving={isSaving}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="content">
              <TabsList className="mb-6">
                <TabsTrigger value="content" data-tab="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="documents" data-tab="documents">Documentos</TabsTrigger>
                <TabsTrigger value="progress" data-tab="progress">Progresso</TabsTrigger>
              </TabsList>

              <TabsContent value="content">
                <ContentTab
                  projectId={projectId || ''}
                  sections={sections}
                  onTextChange={handleSectionTextChange}
                  onSourcesUpdate={handleSourcesUpdate}
                />
              </TabsContent>

              <TabsContent value="documents">
                <DocumentsTab
                  projectId={projectId || ''}
                  files={files}
                  onFileUploaded={handleFileUploaded}
                />
              </TabsContent>

              <TabsContent value="progress">
                <ProgressTab
                  project={project}
                  sections={sections}
                  files={files}
                  onExport={handleExport}
                  isExporting={isExporting}
                />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="lg:col-span-1">
            <SidebarPanel 
              projectId={projectId || ''}
              charsUsed={charsUsed}
              charLimit={totalCharLimit}
              ragStatus="medium"
              sources={sources}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectPage;
