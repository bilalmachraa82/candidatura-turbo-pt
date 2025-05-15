
import { supabase } from '@/lib/supabase';

interface IndexingResult {
  success: boolean;
  documentId?: string;
  message: string;
  file?: {
    id: string;
    name: string;
    type: string;
    url: string;
  };
}

export async function indexDocument(
  projectId: string,
  file: File
): Promise<IndexingResult> {
  try {
    // 1. Upload file to Supabase Storage
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `${projectId}/${fileName}`;
    
    // Try to upload to project_documents bucket
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('project_documents')
      .upload(filePath, file);
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        message: `Erro ao fazer upload: ${uploadError.message}`,
      };
    }
    
    // 2. Get public URL for the uploaded file
    const { data: urlData } = await supabase
      .storage
      .from('project_documents')
      .getPublicUrl(filePath);
    
    const fileUrl = urlData.publicUrl;
    
    try {
      // 3. Store file reference in indexed_files table
      const { data: fileRecord, error: fileError } = await supabase
        .from('indexed_files')
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_type: file.type,
          file_url: fileUrl,
          file_size: file.size,
          status: 'indexed' // Simplified for now, in a real app we'd set to pending_indexing
        })
        .select()
        .single();
      
      if (fileError) {
        throw fileError;
      }
      
      return {
        success: true,
        documentId: fileRecord.id,
        message: 'Documento carregado com sucesso',
        file: {
          id: fileRecord.id,
          name: file.name,
          type: file.type,
          url: fileUrl
        }
      };
    } catch (dbError: any) {
      // If the indexed_files table doesn't exist yet or has errors, still return success for the file upload
      console.warn('Database error:', dbError);
      
      return {
        success: true,
        message: 'Ficheiro carregado mas não indexado.',
        file: {
          id: 'temp-' + Date.now(),
          name: file.name,
          type: file.type,
          url: fileUrl
        }
      };
    }
  } catch (error: any) {
    console.error('Indexing document error:', error);
    return {
      success: false,
      message: `Erro inesperado: ${error.message}`,
    };
  }
}
