
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
    let result: GenerationResult;

    if (provider === 'openrouter') {
      // Call OpenRouter edge function with enhanced parameters
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

      if (!data.success) {
        throw new Error(data.error || 'Erro na geração OpenRouter');
      }

      result = {
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

      if (!data.success) {
        throw new Error(data.error || 'Erro na geração Flowise');
      }

      result = {
        text: data.text,
        charsUsed: data.charsUsed,
        sources: data.sources || [],
        provider: 'flowise',
        model: modelId
      };
    }

    console.log('Generation completed:', { 
      provider: result.provider, 
      charsUsed: result.charsUsed,
      sourcesCount: result.sources.length 
    });
    
    return result;

  } catch (error: any) {
    console.error('Error in generateSection:', error);
    
    // Enhanced fallback strategy
    if (provider === 'openrouter') {
      console.log('OpenRouter failed, trying Flowise fallback...');
      try {
        return await generateSection(projectId, section, charLimit, 'flowise', 'gpt-4o');
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        throw new Error(`Both OpenRouter and Flowise failed: ${error.message}`);
      }
    }

    throw new Error(error.message || 'Erro na geração de texto');
  }
}

// Helper function to test AI connections
export async function testAIConnections(): Promise<{
  openrouter: boolean;
  openai: boolean;
  flowise: boolean;
}> {
  const results = {
    openrouter: false,
    openai: false,
    flowise: false
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

  try {
    // Test OpenAI setup (for embeddings)
    const { data: openaiTest } = await supabase.functions.invoke('setup-openai');
    results.openai = openaiTest?.success || false;
  } catch (error) {
    console.warn('OpenAI test failed:', error);
  }

  return results;
}
