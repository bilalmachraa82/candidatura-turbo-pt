
import { GenerationResult } from '@/types/api';

export async function generateText(
  projectId: string,
  sectionKey: string,
  charLimit: number = 2000,
  model: string = 'gpt-4o'
): Promise<GenerationResult> {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        projectId,
        sectionKey,
        charLimit,
        model
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao gerar texto');
    }

    const data: GenerationResult = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error generating text:', error);
    throw new Error(error.message || 'Erro ao gerar texto com IA');
  }
}
