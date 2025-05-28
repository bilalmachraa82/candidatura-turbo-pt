
import { supabase } from '@/lib/supabase';
import { GenerationResult } from '@/types/api';

export interface GenerateTextRequest {
  projectId: string;
  section: string;
  charLimit?: number;
  model?: string;
  language?: string;
}

export async function generateText(request: GenerateTextRequest): Promise<GenerationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-text', {
      body: request
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro na geração de texto');
    }

    return {
      success: true,
      text: data.text,
      charsUsed: data.charsUsed,
      sources: data.sources || [],
    };
  } catch (error: any) {
    console.error('Erro ao gerar texto:', error);
    return {
      success: false,
      text: '',
      charsUsed: 0,
      sources: [],
      error: error.message || 'Erro desconhecido na geração de texto'
    };
  }
}
