
import { supabase } from '@/lib/supabase';
import { HybridGenerationOptions, GenerationResult } from '@/types/ai';

export async function generateSection(
  projectId: string, 
  section: string, 
  charLimit: number, 
  provider: 'openrouter' | 'flowise', 
  modelId: string
): Promise<GenerationResult> {
  console.log('generateSection called:', { projectId, section, charLimit, provider, modelId });

  try {
    let result: GenerationResult;

    if (provider === 'openrouter') {
      // Call OpenRouter edge function
      const { data, error } = await supabase.functions.invoke('generate-openrouter', {
        body: {
          projectId,
          section,
          charLimit,
          model: modelId
        }
      });

      if (error) {
        console.error('OpenRouter edge function error:', error);
        throw new Error(`OpenRouter error: ${error.message}`);
      }

      result = data;
    } else {
      // Fallback to Flowise (existing generate-text function)
      const { data, error } = await supabase.functions.invoke('generate-text', {
        body: {
          projectId,
          section,
          charLimit,
          model: modelId || 'gpt-4o'
        }
      });

      if (error) {
        console.error('Flowise edge function error:', error);
        throw new Error(`Flowise error: ${error.message}`);
      }

      result = {
        ...data,
        provider: 'flowise',
        model: modelId
      };
    }

    console.log('Generation completed:', { provider, charsUsed: result.charsUsed });
    return result;

  } catch (error: any) {
    console.error('Error in generateSection:', error);
    
    // If OpenRouter fails, try Flowise as fallback
    if (provider === 'openrouter') {
      console.log('OpenRouter failed, trying Flowise fallback...');
      try {
        return await generateSection(projectId, section, charLimit, 'flowise', 'gpt-4o');
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }

    throw new Error(error.message || 'Erro na geração de texto');
  }
}
