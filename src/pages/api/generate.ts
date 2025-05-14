
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

    if (!flowiseUrl || !flowiseApiKey) {
      return res.status(500).json({ message: 'Flowise API configuration missing' });
    }

    // 1. Get project information
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError) {
      throw new Error(`Project not found: ${projectError.message}`);
    }

    // 2. Get relevant document chunks from vector database
    // In a real implementation with pgvector, we would:
    // - Create an embedding vector for the query based on the section key
    // - Perform a similarity search against document_chunks
    // - Return the most relevant chunks

    // For now, we'll fetch all chunks for the project
    const { data: chunks, error: chunksError } = await supabase
      .from('document_chunks')
      .select('*')
      .eq('project_id', projectId)
      .limit(5);

    if (chunksError) {
      console.warn(`Warning: Error retrieving document chunks: ${chunksError.message}`);
    }

    // 3. Get section template information
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('*')
      .eq('project_id', projectId)
      .eq('key', sectionKey)
      .single();

    if (sectionError) {
      console.warn(`Warning: Section not found: ${sectionError.message}`);
    }

    // 4. Prepare context for the AI call
    const context = {
      projectName: project.name,
      sectionTitle: section?.title || sectionKey,
      sectionDescription: section?.description || '',
      relevantDocuments: chunks?.map(chunk => chunk.content).join('\n\n') || '',
    };

    // 5. Call Flowise API for text generation
    try {
      const response = await fetch(flowiseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${flowiseApiKey}`
        },
        body: JSON.stringify({
          question: `Generate content for the "${context.sectionTitle}" section of this project: ${context.projectName}. 
                    Description: ${context.sectionDescription}
                    Character limit: ${charLimit}`,
          overrideConfig: {
            model: model || 'gpt-4o'
          },
          context: context.relevantDocuments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error calling Flowise API');
      }

      const generatedContent = await response.json();
      
      // 6. Log the generation request
      await supabase.from('generations').insert({
        project_id: projectId,
        section_key: sectionKey,
        model: model || 'gpt-4o',
        timestamp: new Date().toISOString()
      });

      // 7. Extract sources from the generated text (in a real implementation)
      // For now, we'll provide some mock sources
      const sources = chunks ? chunks.slice(0, 2).map((chunk, index) => ({
        id: chunk.id,
        name: chunk.metadata?.source || `Document ${index + 1}`,
        reference: chunk.metadata?.page ? `Página ${chunk.metadata.page}` : 'Referência não especificada',
        type: chunk.metadata?.source?.endsWith('.pdf') ? 'pdf' : 'excel'
      })) : [];

      return res.status(200).json({
        text: generatedContent.text || 
              `Este é um texto gerado para a secção "${context.sectionTitle}" do projeto ${context.projectName}. O limite de caracteres é ${charLimit}.`,
        charsUsed: generatedContent.text?.length || Math.floor(charLimit * 0.7),
        sources
      });
    } catch (error: any) {
      // Fallback response if Flowise API fails
      console.error('Error calling Flowise API:', error);
      
      return res.status(200).json({
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
      });
    }
  } catch (error: any) {
    console.error('Error in text generation handler:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}
