
import { supabase } from '@/lib/supabase';

export interface UploadResult {
  success: boolean;
  file?: {
    id: string;
    name: string;
    path: string;
    url: string;
    size: number;
  };
  error?: string;
}

export async function uploadFileToStorage(
  projectId: string,
  file: File,
  userId: string,
  category: string = 'general'
): Promise<UploadResult> {
  try {
    // Create unique file path: userId/projectId/category/filename_timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${sanitizedFileName.split('.')[0]}_${timestamp}.${fileExtension}`;
    const filePath = `${userId}/${projectId}/${category}/${fileName}`;

    console.log('A carregar ficheiro para o caminho:', filePath);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro no carregamento para o storage:', uploadError);
      throw new Error(`Erro no carregamento: ${uploadError.message}`);
    }

    console.log('Ficheiro carregado com sucesso:', uploadData);

    // Get public URL (even though bucket is private, we need the URL for internal use)
    const { data: urlData } = supabase.storage
      .from('project-documents')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    return {
      success: true,
      file: {
        id: uploadData.id || Date.now().toString(),
        name: file.name,
        path: filePath,
        url: publicUrl,
        size: file.size
      }
    };

  } catch (error: any) {
    console.error('Erro no carregamento:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido no carregamento'
    };
  }
}

export async function deleteFileFromStorage(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('project-documents')
      .remove([filePath]);

    if (error) {
      console.error('Erro ao eliminar:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao eliminar ficheiro:', error);
    return false;
  }
}
