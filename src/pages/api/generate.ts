
import { supabase } from '@/lib/supabase';
import { generateText } from '@/api/generateText';
import { GenerationOptions, GenerationResult } from '@/types/api';

// Note: Esta é uma simulação simplificada de API Edge
// Em produção, isso seria uma API Edge Function do Next.js ou Edge Function do Supabase

export async function handler(req: Request) {
  // Verificar método
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    // Parse do body
    const body: GenerationOptions = await req.json();
    
    // Verificar campos obrigatórios
    if (!body.projectId || !body.section) {
      return new Response(JSON.stringify({ error: 'projectId e section são obrigatórios' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Verificar autenticação (opcional numa edge function)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Em ambiente real, verificaríamos com o JWT do Supabase
      // Para fins de POC, permitimos continuar
      console.warn('Requisição sem autenticação ou com formato inválido');
    }

    // Gerar o texto
    const result = await generateText(body);
    
    // Retornar resultado
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('Erro na API de geração:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Erro desconhecido',
      text: '',
      charsUsed: 0,
      sources: []
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export default handler;
