
import { supabase } from '@/lib/supabase';
import { IndexingResult, UploadedFile } from '@/types/api';

/**
 * Uploads a file to Supabase Storage and indexes its content in the vector database
 */
export async function indexDocument(projectId: string, file: File): Promise<IndexingResult> {
  try {
    // First, check if the file is of an allowed type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de ficheiro não suportado: ${file.type}. Por favor faça upload de PDF, Excel, Word ou texto.`);
    }
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error(`Ficheiro demasiado grande: máximo 10MB permitido.`);
    }

    // 1. Call the indexing API endpoint
    const formData = new FormData();
    formData.append('projectId', projectId);
    formData.append('file', file);
    
    const response = await fetch('/api/index', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed with status: ${response.status}`);
    }

    const result = await response.json();
    
    // 2. Store the file reference in Supabase for the UI
    if (result.file) {
      const { error } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_type: file.type,
          file_url: result.file.url,
          file_size: file.size,
          indexed_at: new Date().toISOString()
        });
      
      if (error) {
        console.warn('Warning: Error recording file in project_files:', error);
      }
    }

    return {
      success: true,
      documentId: result.file?.id,
      message: 'Documento carregado e indexado com sucesso',
      file: result.file
    };
  } catch (error: any) {
    console.error('Error indexing document:', error);
    return {
      success: false,
      message: `Falha na indexação: ${error.message}`,
    };
  }
}

/**
 * Lists all indexed documents for a project
 */
export async function listIndexedDocuments(projectId: string): Promise<UploadedFile[]> {
  try {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('indexed_at', { ascending: false });
      
    if (error) throw error;
    
    return (data || []).map(file => ({
      name: file.file_name,
      type: file.file_type,
      url: file.file_url,
    }));
  } catch (error: any) {
    console.error('Error listing indexed documents:', error);
    throw new Error(`Failed to list documents: ${error.message}`);
  }
}

/**
 * Removes an indexed document
 */
export async function removeIndexedDocument(projectId: string, fileName: string): Promise<boolean> {
  try {
    // Find the file record first
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .eq('file_name', fileName)
      .single();
      
    if (error) throw error;
    
    if (!data) {
      throw new Error('Document not found');
    }
    
    // Delete the record
    const { error: deleteError } = await supabase
      .from('project_files')
      .delete()
      .eq('id', data.id);
      
    if (deleteError) throw deleteError;
    
    return true;
  } catch (error: any) {
    console.error('Error removing indexed document:', error);
    return false;
  }
}
