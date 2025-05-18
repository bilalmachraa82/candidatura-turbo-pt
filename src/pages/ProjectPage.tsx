
import React from 'react';
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
  
  const {
    project,
    files,
    sections,
    sources,
    charsUsed,
    totalCharLimit,
    isExporting,
    setIsExporting,
    isLoading,
    handleFileUploaded,
    handleSectionTextChange,
    handleSourcesUpdate
  } = useProject({ projectId });

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
          projectName={project.name} 
          projectId={projectId || ''} 
          isExporting={isExporting}
          setIsExporting={setIsExporting}
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
