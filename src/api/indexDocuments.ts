
import { supabase } from '@/lib/supabase';
import { uploadFileToStorage } from './uploadToStorage';
import { IndexingResult } from '@/types/api';

export async function indexDocument(
  projectId: string,
  file: File
): Promise<IndexingResult> {
  try {
    console.log('Starting document indexing for project:', projectId);

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Utilizador não autenticado');
    }

    // First upload file to storage
    const uploadResult = await uploadFileToStorage(projectId, file, user.id);
    
    if (!uploadResult.success || !uploadResult.file) {
      throw new Error(uploadResult.error || 'Erro no upload do ficheiro');
    }

    console.log('File uploaded to storage:', uploadResult.file);

    // Create file record in database
    const { data: fileRecord, error: fileError } = await supabase
      .from('indexed_files')
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_type: file.type,
        file_url: uploadResult.file.url,
        file_size: file.size,
        storage_path: uploadResult.file.path,
        storage_bucket: 'project-documents',
        status: 'processing'
      })
      .select()
      .single();

    if (fileError) {
      console.error('Error creating file record:', fileError);
      throw new Error('Erro ao criar registo do ficheiro');
    }

    console.log('File record created:', fileRecord);

    // Call the Supabase Edge Function for indexing
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('file', file);
    formData.append('fileRecordId', fileRecord.id);

    const { data: indexData, error: indexError } = await supabase.functions.invoke('index-document', {
      body: formData
    });

    if (indexError) {
      console.error('Edge function error:', indexError);
      
      // Update file status to error
      await supabase
        .from('indexed_files')
        .update({ 
          status: 'error',
          error_message: indexError.message 
        })
        .eq('id', fileRecord.id);
        
      throw new Error(indexError.message || 'Erro na indexação');
    }

    if (!indexData?.success) {
      const errorMsg = indexData?.error || 'Erro na indexação do documento';
      
      // Update file status to error
      await supabase
        .from('indexed_files')
        .update({ 
          status: 'error',
          error_message: errorMsg 
        })
        .eq('id', fileRecord.id);
        
      throw new Error(errorMsg);
    }

    // Update file status to indexed
    await supabase
      .from('indexed_files')
      .update({ status: 'indexed' })
      .eq('id', fileRecord.id);

    console.log('Document indexing completed successfully');

    return {
      success: true,
      documentId: fileRecord.id,
      message: indexData.message || `Documento indexado com sucesso! ${indexData.chunks || 0} segmentos processados.`,
      file: {
        id: fileRecord.id,
        name: file.name,
        type: file.type,
        url: uploadResult.file.url,
        chunks: indexData.chunks || 0
      }
    };

  } catch (error: any) {
    console.error('Error indexing document:', error);
    return {
      success: false,
      message: error.message || 'Error indexing document',
    };
  }
}
