
import { supabase } from '@/lib/supabase';
import { exportDocument } from '@/api/exportDocument';

// Note: Esta é uma simulação simplificada de API Edge
// Em produção, isso seria uma API Edge Function do Next.js ou Edge Function do Supabase

export async function handler(req: Request) {
  // Verificar método
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    // Obter parâmetros da URL
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const format = (url.searchParams.get('format') || 'pdf') as 'pdf' | 'docx';
    const includeAttachments = url.searchParams.get('attachments') === 'true';
    const language = (url.searchParams.get('lang') || 'pt') as 'pt' | 'en';

    // Validar projectId
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId é obrigatório' }), {
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

    // Gerar o documento
    const result = await exportDocument(projectId, format, {
      includeAttachments,
      language
    });

    // Retornar resultado
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('Erro na API de exportação:', error);
    
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
