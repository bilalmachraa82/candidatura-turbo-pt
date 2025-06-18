
import { supabase } from '@/lib/supabase';
import { GenerationResult } from '@/types/ai';

export async function generateSection(
  projectId: string, 
  section: string, 
  charLimit: number, 
  provider: 'openrouter' | 'flowise', 
  modelId: string
): Promise<GenerationResult> {
  console.log('generateSection called:', { projectId, section, charLimit, provider, modelId });

  try {
    // Always use OpenRouter now, ignore provider parameter
    const { data, error } = await supabase.functions.invoke('generate-openrouter', {
      body: {
        projectId,
        section,
        charLimit,
        model: modelId || 'google/gemini-2.0-flash-exp'
      }
    });

    if (error) {
      console.error('OpenRouter edge function error:', error);
      throw new Error(`OpenRouter error: ${error.message}`);
    }

    if (!data.success) {
      throw new Error(data.error || 'Erro na geração OpenRouter');
    }

    const result: GenerationResult = {
      text: data.text,
      charsUsed: data.charsUsed,
      sources: data.sources || [],
      provider: 'openrouter',
      model: modelId
    };

    // Add metadata if available
    if (data.chunksUsed !== undefined) {
      console.log(`Used ${data.chunksUsed} document chunks via ${data.searchMethod} search`);
    }

    console.log('Generation completed:', { 
      provider: result.provider, 
      charsUsed: result.charsUsed,
      sourcesCount: result.sources.length 
    });
    
    return result;

  } catch (error: any) {
    console.error('Error in generateSection:', error);
    throw new Error(error.message || 'Erro na geração de texto');
  }
}

// Test OpenRouter connection
export async function testAIConnections(): Promise<{
  openrouter: boolean;
  openai: boolean;
}> {
  const results = {
    openrouter: false,
    openai: false
  };

  try {
    // Test OpenRouter connection
    const { data: openrouterTest } = await supabase.functions.invoke('generate-openrouter', {
      body: { 
        projectId: 'test', 
        section: 'test', 
        charLimit: 100,
        model: 'google/gemini-2.0-flash-exp'
      }
    });
    results.openrouter = !!openrouterTest;
  } catch (error) {
    console.warn('OpenRouter test failed:', error);
  }

  return results;
}
