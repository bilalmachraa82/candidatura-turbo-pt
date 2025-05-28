
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import SidebarPanel from '@/components/SidebarPanel';
import { useProject } from '@/hooks/use-project';
import ProjectHeader from '@/components/project/ProjectHeader';
import ContentTab from '@/components/project/ContentTab';
import DocumentsTab from '@/components/project/DocumentsTab';

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    project,
    files,
    sections,
    sources,
    charsUsed,
    totalCharLimit,
    isLoading,
    handleFileUploaded,
    handleSectionTextChange,
    handleSourcesUpdate
  } = useProject({ projectId });

  React.useEffect(() => {
    if (project && !isEditing) {
      setEditedTitle(project.title || '');
      setEditedDescription(project.description || '');
    }
  }, [project, isEditing]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset values when canceling
      setEditedTitle(project?.title || '');
      setEditedDescription(project?.description || '');
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (!project || !editedTitle.trim()) return;
    
    setIsSaving(true);
    try {
      // TODO: Implement project update logic
      console.log('Saving project:', { title: editedTitle, description: editedDescription });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
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
          onEditToggle={handleEditToggle}
          onTitleChange={setEditedTitle}
          onDescriptionChange={setEditedDescription}
          onSave={handleSave}
          isSaving={isSaving}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="content">
              <TabsList className="mb-6">
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
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
