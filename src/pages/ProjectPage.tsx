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

interface Source {
  id: string;
  name: string;
  reference: string;
  type: 'excel' | 'pdf';
}

const mockSections: ProjectSection[] = [
  {
    id: '1',
    projectId: '1',
    key: 'analise_mercado',
    title: 'Análise de Mercado',
    description: 'Avaliação do mercado-alvo, tendências e oportunidades',
    content: '',
    charLimit: 2500
  },
  {
    id: '2',
    projectId: '1',
    key: 'proposta_valor',
    title: 'Proposta de Valor',
    description: 'Definição do valor único oferecido ao mercado',
    content: '',
    charLimit: 1500
  },
  {
    id: '3',
    projectId: '1',
    key: 'plano_financeiro',
    title: 'Plano Financeiro',
    description: 'Projeções financeiras e análise de viabilidade',
    content: '',
    charLimit: 3000
  }
];

const mockSources: Source[] = [
  {
    id: '1',
    name: 'Estudo de Viabilidade.xlsx',
    reference: 'Excel: Sheet "Mercado" - B10:D25',
    type: 'excel'
  },
  {
    id: '2',
    name: 'Memória Descritiva.pdf',
    reference: 'PDF: Página 12, Parágrafo 3',
    type: 'pdf'
  }
];

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
          name: projectData.name,
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
          // If no sections found, use default ones
          setSections([
            {
              id: '1',
              projectId: projectId,
              key: 'analise_mercado',
              title: 'Análise de Mercado',
              description: 'Avaliação do mercado-alvo, tendências e oportunidades',
              content: '',
              charLimit: 2500
            },
            {
              id: '2',
              projectId: projectId,
              key: 'proposta_valor',
              title: 'Proposta de Valor',
              description: 'Definição do valor único oferecido ao mercado',
              content: '',
              charLimit: 1500
            },
            {
              id: '3',
              projectId: projectId,
              key: 'plano_financeiro',
              title: 'Plano Financeiro',
              description: 'Projeções financeiras e análise de viabilidade',
              content: '',
              charLimit: 3000
            }
          ]);
        }

        // Fetch uploaded files
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

        // Fetch sources (for now we'll use mock data)
        setSources([
          {
            id: '1',
            name: 'Estudo de Viabilidade.xlsx',
            reference: 'Excel: Sheet "Mercado" - B10:D25',
            type: 'excel'
          },
          {
            id: '2',
            name: 'Memória Descritiva.pdf',
            reference: 'PDF: Página 12, Parágrafo 3',
            type: 'pdf'
          }
        ]);

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
                              <Button variant="ghost" size="sm" className="text-pt-blue">
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
