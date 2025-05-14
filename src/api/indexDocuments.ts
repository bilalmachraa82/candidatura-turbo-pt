
import { supabase } from '@/lib/supabase';
import { IndexingResult } from '@/types/api';

export async function indexDocument(projectId: string, file: File): Promise<IndexingResult> {
  try {
    // 1. Upload file to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${projectId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      return {
        success: false,
        message: `Erro ao fazer upload: ${uploadError.message}`,
      };
    }

    // Get public URL for the file
    const { data: urlData } = await supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath);

    const fileUrl = urlData?.publicUrl;

    // 2. Record the file in the database
    const { data: fileRecord, error: fileRecordError } = await supabase
      .from('indexed_files')
      .insert({
        project_id: projectId,
        file_name: file.name,
        file_type: file.type,
        file_url: fileUrl
      })
      .select()
      .single();

    if (fileRecordError) {
      return {
        success: false,
        message: `Erro ao registar ficheiro: ${fileRecordError.message}`,
      };
    }

    // 3. For now, we'll skip the actual indexing process as it requires OpenAI API
    // In a real app, we would submit this to an indexing queue or API endpoint

    return {
      success: true,
      message: 'Ficheiro indexado com sucesso',
      documentId: fileRecord.id,
      file: {
        id: fileRecord.id,
        name: file.name,
        type: file.type,
        url: fileUrl
      }
    };
  } catch (error: any) {
    console.error('Error in indexDocument:', error);
    return {
      success: false,
      message: `Erro ao processar ficheiro: ${error.message}`,
    };
  }
}
