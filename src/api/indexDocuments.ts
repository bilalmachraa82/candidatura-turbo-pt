
import { supabase } from '@/lib/supabase';

/**
 * Upload and index a document in Supabase
 */
export async function indexDocument(projectId: string, file: File) {
  try {
    if (!projectId || !file) {
      throw new Error('Missing required fields');
    }

    // 1. Upload file to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `documents/${projectId}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Error uploading file: ${uploadError.message}`);
    }

    // Get a public URL for the file
    const { data: urlData } = await supabase
      .storage
      .from('documents')
      .getPublicUrl(filePath);

    const fileUrl = urlData?.publicUrl;

    // 2. Record the uploaded file in the database
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
      throw new Error(`Error recording file: ${fileRecordError.message}`);
    }

    // 3. Create a mock document chunk (in a real implementation, we'd extract text and create embeddings)
    const { data: chunkData, error: chunkError } = await supabase
      .from('document_chunks')
      .insert({
        project_id: projectId,
        file_id: fileRecord.id,
        chunk_index: 0,
        content: `Sample content extracted from ${file.name}`,
        metadata: {
          source: file.name,
          page: 1
        }
      });

    if (chunkError) {
      console.warn(`Warning: Error creating document chunks: ${chunkError.message}`);
    }

    return {
      success: true,
      file: {
        id: fileRecord.id,
        name: file.name,
        type: file.type,
        url: fileUrl
      }
    };
  } catch (error: any) {
    console.error('Error in indexing handler:', error);
    throw error;
  }
}
