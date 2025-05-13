
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

    // Get Flowise API configuration from environment variables
    const flowiseUrl = import.meta.env.VITE_FLOWISE_URL;
    const flowiseApiKey = import.meta.env.VITE_FLOWISE_API_KEY;

    if (!flowiseUrl) {
      return res.status(500).json({ message: 'Flowise URL not configured' });
    }

    // Call the Flowise API for text generation
    try {
      // In a production app, this would be a real API call
      // Simulating API response for prototype
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Log the generation request
      await supabase.from('generations').insert({
        project_id: projectId,
        section_key: sectionKey,
        model: model || 'gpt-4o',
        timestamp: new Date().toISOString()
      });

      // Mock response
      const response = {
        text: `Este é um texto gerado automaticamente para a secção ${sectionKey}. Foi utilizado o limite de caracteres ${charLimit} e o modelo ${model || 'GPT-4o'}.`,
        charsUsed: Math.floor(charLimit * 0.7),
        sources: [
          {
            id: '1',
            name: 'Estudo de Viabilidade.xlsx',
            reference: 'Excel: Sheet "Mercado" - B10:D25',
            type: 'excel'
          },
          {
            id: '2',
            name: 'Memória Descritiva.pdf',
            reference: 'PDF: Página 12, Parágrafo 3',
            type: 'pdf'
          }
        ]
      };

      return res.status(200).json(response);
    } catch (error: any) {
      console.error('Error calling Flowise API:', error);
      return res.status(500).json({ message: 'Error generating text', error: error.message });
    }
  } catch (error: any) {
    console.error('Error in text generation handler:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}
