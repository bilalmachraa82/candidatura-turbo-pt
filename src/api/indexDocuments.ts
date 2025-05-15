
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
    
    // 3. Store file reference in indexed_files table
    const { data: fileRecord, error: fileError } = await supabase
      .from('indexed_files')
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_type: file.type,
        file_url: fileUrl,
        file_size: file.size,
        status: 'pending_indexing'
      })
      .select()
      .single();
    
    if (fileError) {
      console.error('File record error:', fileError);
      return {
        success: false,
        message: `Erro ao registar ficheiro: ${fileError.message}`,
      };
    }
    
    // 4. Trigger indexing process via Edge Function
    const { data: indexData, error: indexError } = await supabase
      .functions
      .invoke('index-document', {
        body: { 
          fileId: fileRecord.id,
          projectId,
          fileUrl,
          fileName: file.name,
          fileType: file.type
        }
      });
    
    if (indexError) {
      console.error('Indexing error:', indexError);
      // Update status to failed
      await supabase
        .from('indexed_files')
        .update({ status: 'indexing_failed', error_message: indexError.message })
        .eq('id', fileRecord.id);
        
      return {
        success: false,
        message: `Erro na indexação: ${indexError.message}`,
      };
    }
    
    // 5. Update file status to indexed
    await supabase
      .from('indexed_files')
      .update({ status: 'indexed' })
      .eq('id', fileRecord.id);
    
    return {
      success: true,
      documentId: fileRecord.id,
      message: 'Documento carregado e indexado com sucesso',
      file: {
        id: fileRecord.id,
        name: file.name,
        type: file.type,
        url: fileUrl
      }
    };
    
  } catch (error: any) {
    console.error('Indexing document error:', error);
    return {
      success: false,
      message: `Erro inesperado: ${error.message}`,
    };
  }
}
