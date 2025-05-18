
import { supabase } from '@/lib/supabase';
import { indexDocument } from '@/api/indexDocuments';

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
    // Parse do body da requisição
    const formData = await req.formData();
    const projectId = formData.get('projectId')?.toString();
    const file = formData.get('file') as File;

    // Validar dados
    if (!projectId || !file) {
      return new Response(JSON.stringify({ error: 'projectId e file são obrigatórios' }), {
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

    // Processar o documento
    const result = await indexDocument(projectId, file);

    // Retornar resultado
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('Erro na API de indexação:', error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Erro desconhecido'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export default handler;
