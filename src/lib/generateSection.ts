
import { supabase } from '@/lib/supabase';
import { GenerationResult } from '@/types/ai';
import { trackAIGeneration, Events, trackEvent } from '@/lib/monitoring';
import { getProviderConfig, type AIProvider } from '@/lib/modelRouter';

export async function generateSection(
  projectId: string,
  section: string,
  charLimit: number,
  provider: AIProvider,
  modelId: string
): Promise<GenerationResult> {
  console.log('generateSection called:', { projectId, section, charLimit, provider, modelId });

  // Track AI generation performance
  trackEvent(Events.AI_GENERATION_STARTED, 'info', { section, provider, modelId });

  try {
    const result = await trackAIGeneration(section, modelId, async () => {
      // Get provider configuration
      const providerConfig = getProviderConfig(provider);

      // Call appropriate edge function based on provider
      const { data, error } = await supabase.functions.invoke(providerConfig.edgeFunction, {
        body: {
          projectId,
          section,
          charLimit,
          model: modelId
        }
      });

      if (error) {
        console.error(`${provider} edge function error:`, error);
        throw new Error(`${provider} error: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || `Erro na geração ${provider}`);
      }

      const generationResult: GenerationResult = {
        text: data.text,
        charsUsed: data.charsUsed,
        sources: data.sources || [],
        provider: provider,
        model: modelId
      };

      // Add metadata if available
      if (data.chunksUsed !== undefined) {
        console.log(`Used ${data.chunksUsed} document chunks via ${data.searchMethod} search`);
      }

      // Log cache performance for Claude
      if (provider === 'claude' && data.usage) {
        console.log('Claude cache performance:', {
          cachedTokens: data.usage.cachedTokens,
          cacheHitRate: data.usage.cacheHitRate,
          estimatedCost: data.usage.estimatedCost
        });
      }

      console.log('Generation completed:', {
        provider: generationResult.provider,
        charsUsed: generationResult.charsUsed,
        sourcesCount: generationResult.sources.length
      });

      return generationResult;
    });

    trackEvent(Events.AI_GENERATION_COMPLETED, 'info', {
      section,
      provider,
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
