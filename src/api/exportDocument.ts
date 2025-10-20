
import { supabase } from '@/lib/supabase';
import { ExportResult } from '@/types/api';

interface ExportOptions {
  format: 'pdf' | 'docx';
  includeAttachments?: boolean;
  language?: 'pt' | 'en';
}

export async function exportDocument(
  projectId: string,
  format: 'pdf' | 'docx' = 'pdf',
  options?: Partial<ExportOptions>
): Promise<ExportResult> {
  try {
    // Call the export-document edge function
    const { data, error } = await supabase.functions.invoke('export-document', {
      body: {
        projectId,
        format,
        includeAttachments: options?.includeAttachments,
        language: options?.language
      }
    });

    if (error) {
      console.error('Export edge function error:', error);
      throw new Error(`Export error: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro na exportação do documento');
    }

    return {
      success: data.success,
      url: data.url,
      fileName: `projeto-${projectId}.${format}`,
      format,
      sections: data.sections || 0,
      attachments: data.attachments || 0,
      metadata: data.metadata
    };
  } catch (error: any) {
    console.error('Error exporting document:', error);
    throw error;
  }
}
