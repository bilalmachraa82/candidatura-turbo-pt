
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { UploadedFile, ProjectSection } from '@/types/components';

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
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

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
        name: projectData.title,
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

  // Convert GenerationSource to Source - use useCallback to prevent recreation on every render
  const handleSourcesUpdate = useCallback((sectionId: string, newSources: any[]) => {
    // Convert from GenerationSource to Source type
    const convertedSources = newSources.map(source => ({
      id: source.id || '',
      name: source.name,
      reference: source.reference,
      type: source.type
    }));
    
    // Only update if sources are different to avoid infinite loops
    setSources(prevSources => {
      // Simple string comparison to check if arrays are equivalent
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
    handleFileUploaded,
    handleSectionTextChange,
    handleSourcesUpdate
  };
}
