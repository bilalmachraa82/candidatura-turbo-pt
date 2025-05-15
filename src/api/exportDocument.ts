
import { ExportResult } from '@/types/api';
import { supabase } from '@/lib/supabase';

export async function exportDocument(
  projectId: string,
  format: 'pdf' | 'docx' = 'pdf',
  options?: {
    language?: 'pt' | 'en',
    includeSources?: boolean
  }
): Promise<ExportResult> {
  try {
    // 1. Get project data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (projectError) throw projectError;
    
    // 2. Get all sections for this project
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('project_id', projectId);
    
    if (sectionsError) throw sectionsError;
    
    // 3. Get all files for this project
    const { data: files, error: filesError } = await supabase
      .from('indexed_files')
      .select('*')
      .eq('project_id', projectId);
    
    if (filesError) throw filesError;
    
    // 4. Generate document using Edge Function
    const { data, error } = await supabase.functions.invoke('export-document', {
      body: {
        projectId,
        format,
        options,
        projectName: project.title,
        sections: sections || [],
        files: files || []
      }
    });
    
    if (error) throw error;
    
    // 5. Return the export result
    return {
      success: true,
      url: data.url,
      fileName: data.fileName,
      format,
      sections: sections?.length || 0,
      attachments: files?.length || 0,
      metadata: {
        projectName: project.title,
        exportDate: new Date().toISOString(),
        pageCount: data.pageCount || 0,
        language: options?.language || 'pt'
      }
    };
  } catch (error: any) {
    console.error('Export document error:', error);
    throw new Error(`Erro na exportação: ${error.message}`);
  }
}
