
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
    // Get environment variables
    const FLOWISE_URL = import.meta.env.VITE_FLOWISE_URL;
    const FLOWISE_API_KEY = import.meta.env.VITE_FLOWISE_API_KEY;

    if (!FLOWISE_URL) {
      throw new Error('FLOWISE_URL não está configurado');
    }

    // Build query params
    const params = new URLSearchParams({
      projectId,
      format
    });
    
    // Add optional params
    if (options?.includeAttachments) {
      params.append('attachments', options.includeAttachments.toString());
    }
    
    if (options?.language) {
      params.append('lang', options.language);
    }

    // Make request to the export API
    const response = await fetch(`${FLOWISE_URL}/export?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLOWISE_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: result.success,
      url: result.url,
      fileName: `projeto-${projectId}.${format}`,
      format,
      sections: result.sections || 0,
      attachments: result.attachments || 0,
      metadata: result.metadata
    };
  } catch (error: any) {
    console.error('Error exporting document:', error);
    throw error;
  }
}
