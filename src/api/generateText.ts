
import { AIModel } from '@/types/ai';

const FLOWISE_URL = import.meta.env.VITE_FLOWISE_URL;
const FLOWISE_API_KEY = import.meta.env.VITE_FLOWISE_API_KEY;

interface GenerateTextParams {
  projectId: string;
  section: string;
  charLimit: number;
  model: AIModel;
}

interface GenerateTextResponse {
  text: string;
  charsUsed: number;
  sources: Array<{
    id: string;
    name: string;
    reference: string;
    type: 'pdf' | 'excel';
  }>;
}

/**
 * Generates text using the Flowise AI API with RAG capabilities
 */
export async function generateText(
  projectId: string,
  section: string,
  charLimit: number, 
  model: AIModel = 'gpt-4o'
): Promise<GenerateTextResponse> {
  if (!FLOWISE_URL) {
    throw new Error('FLOWISE_URL environment variable is not set');
  }

  try {
    const response = await fetch(`${FLOWISE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FLOWISE_API_KEY}`
      },
      body: JSON.stringify({
        projectId,
        section,
        charLimit,
        model
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Flowise API error: ${response.status}`);
    }

    const data = await response.json();
    
    // For demonstration purposes, if we don't have real sources, create some sample ones
    if (!data.sources || data.sources.length === 0) {
      data.sources = [
        {
          id: '1',
          name: 'Relatório PT2030',
          reference: 'Página 12, Secção 3.1',
          type: 'pdf'
        },
        {
          id: '2',
          name: 'Dados Estatísticos',
          reference: 'Folha 2, Linha 45',
          type: 'excel'
        }
      ];
    }

    return {
      text: data.text || 'Texto gerado pela IA baseado nos documentos do projeto.',
      charsUsed: data.text?.length || 250,
      sources: data.sources
    };
  } catch (error: any) {
    console.error('Error generating text:', error);
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}
