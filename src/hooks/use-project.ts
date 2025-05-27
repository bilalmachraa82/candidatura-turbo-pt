import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UploadedFile, ProjectSection } from '@/types/components';
import { indexDocument } from '@/api/indexDocuments';
import { GenerationSource } from '@/types/api';
import { PT2030_SECTIONS } from '@/data/pt2030_sections';

interface UseProjectProps {
  projectId: string | undefined;
}

export function useProject({ projectId }: UseProjectProps) {
  const [project, setProject] = useState<{name: string, status: string} | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [charsUsed, setCharsUsed] = useState(0);
  const [totalCharLimit, setTotalCharLimit] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexed, setIndexed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const totalUsed = sections.reduce((acc, section) => acc + section.content.length, 0);
    setCharsUsed(totalUsed);
    
    const total = sections.reduce((acc, section) => acc + section.charLimit, 0);
    setTotalCharLimit(total);
  }, [sections]);

  useEffect(() => {
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchProject = async () => {
    setIsLoading(true);
    try {
      if (!projectId) return;

      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      
      setProject({
        name: projectData.title,
        status: projectData.status || 'draft'
      });

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
        // Criar seções usando PT2030_SECTIONS
        const defaultSections = PT2030_SECTIONS.map(section => ({
          project_id: projectId,
          key: section.code,
          title: section.title,
          description: section.description,
          content: '',
          char_limit: section.charLimit
        }));
        
        for (const section of defaultSections) {
          await supabase.from('sections').insert(section);
        }
        
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

      try {
        const { data: filesData, error: filesError } = await supabase
          .from('indexed_files')
          .select('*')
          .eq('project_id', projectId);

        if (!filesError && filesData && filesData.length > 0) {
          setIndexed(true);
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

  const handleFileUploaded = async (file: {name: string, url: string, type: string}) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      url: file.url,
      type: file.type,
      uploadDate: new Date().toISOString()
    };
    
    setFiles(prev => [...prev, newFile]);
    await indexFileForRAG(file);
  };

  const indexFileForRAG = async (file: {name: string, url: string, type: string}) => {
    if (!projectId) return;
    
    setIsIndexing(true);
    
    try {
      const fileResponse = await fetch(file.url);
      const fileBlob = await fileResponse.blob();
      const fileObject = new File([fileBlob], file.name, { type: file.type });
      
      const indexResult = await indexDocument(projectId, fileObject);
      
      if (indexResult.success) {
        setIndexed(true);
        toast({
          title: "Indexação concluída",
          description: "O documento foi indexado com sucesso para RAG."
        });
      } else {
        throw new Error(indexResult.message);
      }
      
    } catch (error: any) {
      console.error("Error indexing file for RAG:", error);
      toast({
        variant: "destructive",
        title: "Erro na indexação",
        description: error.message || "Não foi possível indexar o documento."
      });
    } finally {
      setIsIndexing(false);
    }
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

  const handleSourcesUpdate = useCallback((sectionId: string, newSources: any[]) => {
    const convertedSources = newSources.map(source => ({
      id: source.id || '',
      name: source.name,
      reference: source.reference,
      type: source.type
    }));
    
    setSources(prevSources => {
      const prevSourcesString = JSON.stringify(prevSources);
      const newSourcesString = JSON.stringify(convertedSources);
      
      if (prevSourcesString !== newSourcesString) {
        return convertedSources;
      }
      return prevSources;
    });
  }, []);

  return {
    project,
    files,
    sections,
    sources,
    charsUsed,
    totalCharLimit,
    isExporting,
    setIsExporting,
    isLoading,
    isIndexing,
    indexed,
    handleFileUploaded,
    handleSectionTextChange,
    handleSourcesUpdate
  };
}
