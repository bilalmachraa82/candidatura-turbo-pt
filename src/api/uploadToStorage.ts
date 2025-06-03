
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
  userId: string
): Promise<UploadResult> {
  try {
    // Create unique file path: userId/projectId/filename_timestamp
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${sanitizedFileName.split('.')[0]}_${timestamp}.${fileExtension}`;
    const filePath = `${userId}/${projectId}/${fileName}`;

    console.log('Uploading file to path:', filePath);

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    console.log('File uploaded successfully:', uploadData);

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
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido no upload'
    };
  }
}

export async function deleteFileFromStorage(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('project-documents')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete file error:', error);
    return false;
  }
}
