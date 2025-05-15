
import { GenerationResult } from '@/types/api';
import { supabase } from '@/lib/supabase';

export async function generateText(
  projectId: string,
  sectionKey: string,
  charLimit: number,
  model: string = 'gpt-4o'
): Promise<GenerationResult> {
  try {
    // 1. Get related documents for this project
    const { data: documents, error: docsError } = await supabase
      .from('indexed_files')
      .select('id, file_name, file_type, file_url')
      .eq('project_id', projectId)
      .eq('status', 'indexed');
    
    if (docsError) throw docsError;
    
    // 2. Generate text using Flowise API
    const flowiseUrl = process.env.FLOWISE_URL || 'https://flowise-api.example.com';
    const flowiseApiKey = process.env.FLOWISE_API_KEY || '';
    
    const response = await fetch(`${flowiseUrl}/api/v1/prediction/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${flowiseApiKey}`
      },
      body: JSON.stringify({
        projectId,
        sectionKey,
        charLimit,
        model,
        documents: documents || []
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error generating text with AI');
    }
    
    const generationData = await response.json();
    
    // 3. Format and return the result
    return {
      text: generationData.text || '',
      charsUsed: generationData.text?.length || 0,
      sources: generationData.sources || []
    };
  } catch (error: any) {
    console.error('Generate text error:', error);
    throw new Error(`Erro na geração de texto: ${error.message}`);
  }
}
