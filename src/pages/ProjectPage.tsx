import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import UploadForm from '@/components/UploadForm';
import SectionEditor from '@/components/SectionEditor';
import SidebarPanel from '@/components/SidebarPanel';
import { supabase } from '@/lib/supabase';
import { exportDocument } from '@/api/exportDocument';
import { UploadFormProps } from '@/types/components';
import { GenerationSource } from '@/types/api';
import { Source } from '@/types/ai';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadDate: string;
}

interface ProjectSection {
  id: string;
  projectId: string;
  key: string;
  title: string;
  description: string;
  content: string;
  charLimit: number;
}

const ProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<{name: string, status: string} | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [charsUsed, setCharsUsed] = useState(0);
  const [totalCharLimit, setTotalCharLimit] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Calculate total character usage across all sections
  useEffect(() => {
    const totalUsed = sections.reduce((acc, section) => acc + section.content.length, 0);
    setCharsUsed(totalUsed);
    
    const total = sections.reduce((acc, section) => acc + section.charLimit, 0);
    setTotalCharLimit(total);
  }, [sections]);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      try {
        if (!projectId) return;

        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        
        setProject({
          name: projectData.title, // Changed from name to title to match the DB schema
          status: projectData.status || 'draft'
        });

        // Fetch project sections
        const { data: sectionsData, error: sectionsError } = await supabase
          .from('sections')
          .select('*')
          .eq('project_id', projectId);

        if (sectionsError) throw sectionsError;

        if (sectionsData && sectionsData.length > 0) {
          setSections(sectionsData.map(s => ({
            id: s.id,
            projectId: s.project_id,
            key: s.key,
            title: s.title,
            description: s.description || '',
            content: s.content || '',
            charLimit: s.char_limit || 2000
          })));
        } else {
          // If no sections found, create default ones in the DB and use them
          const defaultSections = [
            {
              projectId: projectId,
              key: 'analise_mercado',
              title: 'Análise de Mercado',
              description: 'Avaliação do mercado-alvo, tendências e oportunidades',
              content: '',
              char_limit: 2500
            },
            {
              projectId: projectId,
              key: 'proposta_valor',
              title: 'Proposta de Valor',
              description: 'Definição do valor único oferecido ao mercado',
              content: '',
              char_limit: 1500
            },
            {
              projectId: projectId,
              key: 'plano_financeiro',
              title: 'Plano Financeiro',
              description: 'Projeções financeiras e análise de viabilidade',
              content: '',
              char_limit: 3000
            }
          ];
          
          // Insert default sections into the database
          for (const section of defaultSections) {
            await supabase.from('sections').insert({
              project_id: section.projectId,
              key: section.key,
              title: section.title,
              description: section.description,
              content: section.content,
              char_limit: section.char_limit
            });
          }
          
          // Fetch the newly created sections to get their IDs
          const { data: newSectionsData } = await supabase
            .from('sections')
            .select('*')
            .eq('project_id', projectId);
            
          if (newSectionsData) {
            setSections(newSectionsData.map(s => ({
              id: s.id,
              projectId: s.project_id,
              key: s.key,
              title: s.title,
              description: s.description || '',
              content: s.content || '',
              charLimit: s.char_limit || 2000
            })));
          }
        }

        // Fetch uploaded files
        try {
          const { data: filesData, error: filesError } = await supabase
            .from('indexed_files')
            .select('*')
            .eq('project_id', projectId);

          if (!filesError && filesData) {
            setFiles(filesData.map(f => ({
              id: f.id,
              name: f.file_name,
              url: f.file_url,
              type: f.file_type,
              uploadDate: f.created_at
            })));
          }
        } catch (error) {
          console.warn("Could not load indexed files, table might be empty:", error);
        }

      } catch (error) {
        console.error("Error fetching project:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar o projeto"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (projectId) {
      fetchProject();
    }
  }, [projectId, toast]);

  const handleFileUploaded = (file: {name: string, url: string, type: string}) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      url: file.url,
      type: file.type,
      uploadDate: new Date().toISOString()
    };
    
    setFiles(prev => [...prev, newFile]);
  };

  const handleSectionTextChange = (sectionId: string, newText: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, content: newText } 
          : section
      )
    );
  };

  // Convert GenerationSource to Source
  const handleSourcesUpdate = (sectionId: string, newSources: GenerationSource[]) => {
    // Convert from GenerationSource to Source type
    const convertedSources: Source[] = newSources.map(source => ({
      id: source.id,
      name: source.name,
      reference: source.reference,
      type: source.type
    }));
    
    setSources(convertedSources);
  };

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (!projectId) return;
    
    setIsExporting(true);
    
    try {
      const result = await exportDocument(projectId, format);
      
      toast({
        title: "Exportação concluída",
        description: `O seu dossiê foi exportado em formato ${format.toUpperCase()}.`
      });
      
      // In a real implementation, this would trigger a download
      // window.open(result.url, '_blank');
    } catch (error: any) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: error.message || "Não foi possível exportar o dossiê. Por favor tente novamente."
      });
    } finally {
      setIsExporting(false);
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <Link to="/" className="text-pt-blue hover:text-pt-green inline-flex items-center mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Voltar aos projetos</span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-pt-blue">{project.name}</h1>
          </div>
          <div className="mt-4 md:mt-0 flex gap-2">
            <Button 
              variant="outline" 
              className="border-pt-blue text-pt-blue hover:bg-pt-blue hover:text-white"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button 
              variant="outline" 
              className="border-pt-blue text-pt-blue hover:bg-pt-blue hover:text-white"
              onClick={() => handleExport('docx')}
              disabled={isExporting}
            >
              <FileText className="mr-2 h-4 w-4" />
              Exportar DOCX
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="content">
              <TabsList className="mb-6">
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="space-y-6">
                {sections.map((section) => (
                  <SectionEditor
                    key={section.id}
                    title={section.title}
                    description={section.description}
                    sectionKey={section.key}
                    projectId={projectId || ''}
                    initialText={section.content}
                    charLimit={section.charLimit}
                    onTextChange={(text) => handleSectionTextChange(section.id, text)}
                    onSourcesUpdate={(newSources) => handleSourcesUpdate(section.id, newSources)}
                  />
                ))}
              </TabsContent>
              
              <TabsContent value="documents">
                <div className="space-y-8">
                  <UploadForm 
                    title="Memória Descritiva"
                    description="Carregue o documento de memória descritiva do projeto"
                    projectId={projectId || ''}
                    onFileUploaded={handleFileUploaded}
                  />
                  
                  <UploadForm 
                    title="Estudo de Viabilidade Económico-Financeira (EVEF)"
                    description="Carregue o EVEF em formato Excel (.xlsx)"
                    projectId={projectId || ''}
                    acceptedFileTypes="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onFileUploaded={handleFileUploaded}
                  />
                  
                  <UploadForm 
                    title="Dossiê de Estratégia"
                    description="Carregue documentação adicional relevante para o projeto"
                    projectId={projectId || ''}
                    onFileUploaded={handleFileUploaded}
                  />
                  
                  {files.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium text-pt-blue mb-4">Ficheiros Carregados</h3>
                      <div className="bg-gray-50 rounded-lg border p-4">
                        <ul className="divide-y">
                          {files.map((file) => (
                            <li key={file.id} className="py-3 flex items-center justify-between">
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 text-pt-blue mr-3" />
                                <div>
                                  <p className="font-medium">{file.name}</p>
                                  <p className="text-xs text-gray-500">
                                    Carregado em {new Date(file.uploadDate).toLocaleDateString('pt-PT')}
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-pt-blue"
                                onClick={() => window.open(file.url, '_blank')}
                              >
                                Visualizar
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
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
