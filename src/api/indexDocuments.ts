
import { supabase } from '@/lib/supabase';
import { IndexingResult } from '@/types/api';

// Function to upload and index a document
export async function indexDocument(
  projectId: string,
  file: File
): Promise<IndexingResult> {
  try {
    // Create form data for the file upload
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('file', file);

    // Get environment variables
    const FLOWISE_URL = import.meta.env.VITE_FLOWISE_URL;
    const FLOWISE_API_KEY = import.meta.env.VITE_FLOWISE_API_KEY;

    if (!FLOWISE_URL) {
      throw new Error('FLOWISE_URL não está configurado');
    }

    // Call the /api/index endpoint
    const response = await fetch(`${FLOWISE_URL}/api/index`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLOWISE_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const result = await response.json();

    // Update the file status in our local database if needed
    if (result.success && result.file) {
      try {
        await supabase.from('indexed_files').upsert({
          id: result.file.id,
          project_id: projectId,
          file_name: result.file.name,
          file_type: result.file.type,
          file_url: result.file.url,
          status: 'indexed',
          created_at: new Date().toISOString()
        });
      } catch (dbError) {
        console.warn('Failed to update indexed file status:', dbError);
      }
    }

    return result;
  } catch (error: any) {
    console.error('Error indexing document:', error);
    return {
      success: false,
      message: error.message || 'Error indexing document',
    };
  }
}
