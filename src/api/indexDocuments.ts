
import { supabase } from '@/lib/supabase';
import { IndexingResult } from '@/types/api';

export async function indexDocument(
  projectId: string,
  file: File
): Promise<IndexingResult> {
  try {
    // Create form data for the file upload
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('file', file);

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('index-document', {
      body: formData
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro na indexação do documento');
    }

    // Update local database if needed
    if (data.file) {
      try {
        await supabase.from('indexed_files').upsert({
          id: data.file.id,
          project_id: projectId,
          file_name: data.file.name,
          file_type: data.file.type,
          file_url: data.file.url,
          status: 'indexed',
          created_at: new Date().toISOString()
        });
      } catch (dbError) {
        console.warn('Failed to update indexed file status:', dbError);
      }
    }

    return {
      success: true,
      documentId: data.file?.id,
      message: data.message,
      file: data.file
    };
  } catch (error: any) {
    console.error('Error indexing document:', error);
    return {
      success: false,
      message: error.message || 'Error indexing document',
    };
  }
}
