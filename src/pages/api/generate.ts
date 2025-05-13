
import { supabase } from '@/lib/supabase';

// Simplified request/response types
type Request = {
  method?: string;
  body?: any;
  query?: Record<string, string | string[]>;
};

type Response = {
  status: (code: number) => Response;
  json: (data: any) => void;
};

export default async function handler(
  req: Request,
  res: Response
) {
  if (req?.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId, sectionKey, charLimit, model } = req.body || {};

    if (!projectId || !sectionKey || !charLimit) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Log the generation attempt
    await supabase
      .from('generations')
      .insert({
        project_id: projectId,
        section_key: sectionKey,
        model: model || 'gpt-4o',
        timestamp: new Date().toISOString(),
      });

    // 1. Retrieve relevant documents from the vector store
    // In a real implementation, we would:
    // - Create an embedding for the section context
    // - Query the pgvector table to find relevant text chunks
    // - Consolidate the context

    // 2. Call the Flowise API for text generation
    const flowiseUrl = process.env.FLOWISE_URL;
    const flowiseApiKey = process.env.FLOWISE_API_KEY;

    if (!flowiseUrl || !flowiseApiKey) {
      throw new Error('Missing Flowise environment variables');
    }

    const response = await fetch(`${flowiseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${flowiseApiKey}`,
      },
      body: JSON.stringify({
        projectId,
        sectionKey,
        charLimit,
        model: model || 'gpt-4o',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Flowise API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      text: data.text,
      charsUsed: data.text.length,
      sources: data.sources || [],
    });
  } catch (error: any) {
    console.error('Error generating text:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while generating text',
    });
  }
}
