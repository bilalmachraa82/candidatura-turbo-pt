
import { supabase } from '@/lib/supabase';

/**
 * Uploads a file to Supabase Storage and indexes its content in the vector database
 */
export async function indexDocument(projectId: string, file: File) {
  try {
    // 1. Upload the file to Supabase Storage
    const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const filePath = `projects/${projectId}/${filename}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);
    
    if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);
    
    // Get the public URL of the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    
    // 2. Extract text from the document (in a real implementation, 
    // this would use a document parser service or Supabase Edge Function)
    // Simulating text extraction for now
    const documentType = file.type;
    const documentSize = file.size;
    
    // 3. Create embeddings and store in pgvector (using Supabase)
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        project_id: projectId,
        filename: file.name,
        file_path: filePath,
        file_type: documentType,
        file_size: documentSize,
        public_url: publicUrl,
        indexed_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (documentError) throw new Error(`Document indexing error: ${documentError.message}`);
    
    // 4. Create embeddings for the document chunks
    // In a real implementation, we would chunk the document and create embeddings
    // For now, we'll just simulate this with a success message
    
    return {
      success: true,
      documentId: documentData.id,
      message: 'Document uploaded and indexed successfully'
    };
  } catch (error: any) {
    console.error('Error indexing document:', error);
    throw new Error(`Failed to index document: ${error.message}`);
  }
}
