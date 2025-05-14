
import { supabase } from '@/lib/supabase';

/**
 * Export project as document in specified format
 */
export async function exportDocument(
  projectId: string, 
  format: 'pdf' | 'docx', 
  language: string = 'pt'
) {
  try {
    if (!projectId || !format) {
      throw new Error('Missing required fields');
    }

    if (format !== 'pdf' && format !== 'docx') {
      throw new Error('Invalid format. Must be pdf or docx');
    }

    // 1. Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // 2. Fetch sections content
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('project_id', projectId)
      .order('key', { ascending: true });

    if (sectionsError) {
      throw new Error('Failed to retrieve project sections');
    }

    // 3. Fetch attached documents
    const { data: attachments, error: attachmentsError } = await supabase
      .from('indexed_files')
      .select('*')
      .eq('project_id', projectId);

    if (attachmentsError) {
      console.warn('Warning: Failed to retrieve attachments');
    }

    // 4. Generate document (in a real implementation, we would use proper PDF/DOCX libraries)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `PT2030_${project.name.replace(/\s+/g, '_')}_${timestamp}.${format}`;
    
    // Mock storage URL (in real implementation, we would generate and upload the file)
    const documentUrl = `https://storage.example.com/exports/${projectId}/${fileName}`;

    // 5. Log the export
    await supabase
      .from('exports')
      .insert({
        project_id: projectId,
        format,
        language: language || 'pt',
        exported_at: new Date().toISOString(),
        document_url: documentUrl
      });

    return {
      success: true,
      url: documentUrl,
      fileName,
      format,
      sections: sections.length,
      attachments: attachments?.length || 0
    };
  } catch (error: any) {
    console.error('Error exporting document:', error);
    throw new Error(error.message || 'An error occurred while exporting the document');
  }
}
