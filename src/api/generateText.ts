
import { AIModel } from '@/types/ai';
import { GenerationResult } from '@/types/api';

const FLOWISE_URL = import.meta.env.VITE_FLOWISE_URL;
const FLOWISE_API_KEY = import.meta.env.VITE_FLOWISE_API_KEY;

/**
 * Generates text using the Flowise AI API with RAG capabilities
 */
export async function generateText(
  projectId: string,
  section: string,
  charLimit: number, 
  model: AIModel = 'gpt-4o'
): Promise<GenerationResult> {
  try {
    // Call the generate API endpoint
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        sectionKey: section,
        charLimit,
        model
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      text: data.text || 'Texto gerado pela IA baseado nos documentos do projeto.',
      charsUsed: data.text?.length || 250,
      sources: data.sources || []
    };
  } catch (error: any) {
    console.error('Error generating text:', error);
    throw new Error(`Falha na geração de texto: ${error.message}`);
  }
}
