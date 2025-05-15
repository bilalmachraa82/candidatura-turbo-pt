
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { GenerationResult } from '@/types/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { projectId, sectionKey, charLimit, model } = req.body;

    if (!projectId || !sectionKey) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate if project exists
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, title')
      .eq('id', projectId)
      .single();

    if (projectError || !projectData) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find relevant document chunks for this project
    const { data: chunks, error: chunksError } = await supabase
      .rpc('match_document_chunks', { 
        query_embedding: [], // Placeholder for now - should be embedding of section key/description
        match_threshold: 0.5,
        match_count: 5,
        p_project_id: projectId
      });

    if (chunksError) {
      console.error('Error fetching document chunks:', chunksError);
    }

    // Extract context from chunks
    const context = chunks?.map(chunk => chunk.content).join('\n') || '';

    // Define the prompt for Flowise based on the section and available context
    const prompt = `Generate content for the "${sectionKey}" section of project "${projectData.title}". 
    The content should be professional, clear, and suitable for a PT2030 funding application.
    Use the following context information if relevant: ${context ? context.substring(0, 1000) : 'No context available'}
    Limit response to approximately ${charLimit} characters.`;

    // Prepare and make request to Flowise API
    const flowiseUrl = process.env.FLOWISE_URL || 'https://flowise-demo.lovable.ai';
    const flowiseApiKey = process.env.FLOWISE_API_KEY;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (flowiseApiKey) {
      headers['Authorization'] = `Bearer ${flowiseApiKey}`;
    }

    const flowiseResponse = await fetch(`${flowiseUrl}/api/v1/prediction/flow`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question: prompt,
        modelName: model || 'gpt-4o',
        overrideConfig: {
          template: prompt
        }
      })
    });

    if (!flowiseResponse.ok) {
      const errorText = await flowiseResponse.text();
      throw new Error(`Flowise API error (${flowiseResponse.status}): ${errorText}`);
    }

    const flowiseData = await flowiseResponse.json();
    const generatedText = flowiseData.text || flowiseData.answer || 'Não foi possível gerar texto.';

    // Record this generation in the database
    await supabase.from('generations').insert({
      project_id: projectId,
      section_key: sectionKey,
      model: model || 'gpt-4o'
    });

    // Generate mock sources for now (in a real app, these would come from the chunks)
    const sources = chunks?.map(chunk => ({
      id: chunk.id,
      name: chunk.metadata?.source || 'Documento',
      reference: `Página ${chunk.metadata?.page || '1'}`,
      type: chunk.metadata?.source?.includes('.pdf') ? 'pdf' : 'document'
    })) || [];

    const result: GenerationResult = {
      text: generatedText.substring(0, charLimit),
      charsUsed: Math.min(generatedText.length, charLimit),
      sources: sources
    };

    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Error in generation API:', error);
    return res.status(500).json({ 
      message: 'Error generating text', 
      error: error.message 
    });
  }
}
