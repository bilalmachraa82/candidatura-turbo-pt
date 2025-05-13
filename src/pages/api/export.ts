
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId, format, language } = req.query;

    if (!projectId || !format) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (format !== 'pdf' && format !== 'docx') {
      return res.status(400).json({ message: 'Invalid format. Must be pdf or docx' });
    }

    // 1. Fetch project details and content sections
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    // 2. Fetch all sections content
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('project_id', projectId);

    if (sectionsError) {
      throw new Error('Failed to retrieve project sections');
    }

    // 3. Generate document (in a real implementation)
    // Here we would use jsPDF for PDF or docx library for DOCX format
    
    // For now, we'll just mock the response
    const documentUrl = `https://storage.example.com/exports/${projectId}_${Date.now()}.${format}`;

    // 4. Log the export
    await supabase
      .from('exports')
      .insert({
        project_id: projectId,
        format,
        language: language || 'pt',
        exported_at: new Date().toISOString(),
        document_url: documentUrl
      });

    // In a real implementation, we would:
    // - Generate the document with the appropriate library
    // - Upload it to Supabase Storage
    // - Return the public URL

    return res.status(200).json({
      success: true,
      url: documentUrl,
      format,
    });
  } catch (error: any) {
    console.error('Error exporting document:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while exporting the document',
    });
  }
}
