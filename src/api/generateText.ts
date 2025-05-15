
import { GenerationResult } from '@/types/api';
import { supabase } from '@/lib/supabase';

export async function generateText(
  projectId: string,
  sectionKey: string,
  charLimit: number,
  model: string = 'gpt-4o'
): Promise<GenerationResult> {
  try {
    // Try to get related documents for this project
    // This might fail if the table doesn't exist yet, so we'll handle the error gracefully
    let documents = [];
    try {
      const { data, error } = await supabase
        .from('indexed_files')
        .select('id, file_name, file_type, file_url')
        .eq('project_id', projectId)
        .eq('status', 'indexed');
      
      if (!error && data) {
        documents = data;
      }
    } catch (e) {
      console.warn('Could not fetch indexed files, continuing without them');
    }
    
    // 2. Generate text using Flowise API or fallback to mock data
    let generatedContent;
    
    try {
      // Try to use FLOWISE API if configured
      const flowiseUrl = import.meta.env.VITE_FLOWISE_URL;
      const flowiseApiKey = import.meta.env.VITE_FLOWISE_API_KEY;
      
      if (flowiseUrl && flowiseApiKey) {
        const response = await fetch(`${flowiseUrl}/api/v1/prediction/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${flowiseApiKey}`
          },
          body: JSON.stringify({
            projectId,
            sectionKey,
            charLimit,
            model,
            documents: documents || []
          })
        });
        
        if (response.ok) {
          generatedContent = await response.json();
        } else {
          // If API fails, throw to use fallback
          throw new Error('Flowise API error');
        }
      } else {
        // If Flowise is not configured, throw to use fallback
        throw new Error('Flowise not configured');
      }
    } catch (error) {
      console.warn('Using fallback generation method:', error);
      
      // Mock generation result
      generatedContent = {
        text: `Este é um exemplo de texto gerado para a secção "${sectionKey}". 
               Na implementação final, isto seria substituído por texto gerado pelo modelo ${model}.
               Este conteúdo serve para demonstrar a funcionalidade de geração e permite testar
               a interface sem a necessidade de configurar a API Flowise.`,
        sources: []
      };
    }

    // Try to log the generation in the database, but don't fail if it doesn't work
    try {
      await supabase.from('generations').insert({
        project_id: projectId,
        section_key: sectionKey,
        model: model || 'gpt-4o',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Could not log generation to database');
    }
    
    // 3. Format and return the result with mock sources if needed
    return {
      text: generatedContent.text || '',
      charsUsed: generatedContent.text?.length || 0,
      sources: generatedContent.sources || [
        {
          id: '1',
          name: 'Documento Exemplo.pdf',
          reference: 'PDF: Página 5, Secção "Análise"',
          type: 'pdf'
        },
        {
          id: '2',
          name: 'Dados Económicos.xlsx',
          reference: 'Excel: Sheet "Projeções" - Células B10:D20',
          type: 'excel'
        }
      ]
    };
  } catch (error: any) {
    console.error('Generate text error:', error);
    throw new Error(`Erro na geração de texto: ${error.message}`);
  }
}
