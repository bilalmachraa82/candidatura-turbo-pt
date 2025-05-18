
// Supabase Edge Function para exportação de documentos
// Este arquivo será implantado automaticamente no Supabase Edge Functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Handler principal da Edge Function
Deno.serve(async (req) => {
  // Verificar método
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Parse do corpo da requisição
    const { projectId, format = 'pdf', includeAttachments = false, language = 'pt' } = await req.json();
    
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Missing projectId in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar formato válido
    if (format !== 'pdf' && format !== 'docx') {
      return new Response(JSON.stringify({ error: 'Invalid format. Must be "pdf" or "docx"' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Criar cliente Supabase usando as variáveis de ambiente da Edge Function
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Buscar informações do projeto
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (projectError || !projectData) {
      return new Response(JSON.stringify({ error: `Project not found: ${projectError?.message}` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Buscar seções do projeto
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('project_id', projectId)
      .order('key');
    
    if (sectionsError) {
      console.error(`[export-document] Erro ao buscar seções: ${sectionsError.message}`);
    }
    
    // Buscar arquivos anexos, se solicitado
    let filesData = [];
    if (includeAttachments) {
      const { data: files, error: filesError } = await supabase
        .from('indexed_files')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'indexed');
      
      if (!filesError && files) {
        filesData = files;
      }
    }
    
    console.log(`[export-document] Gerando ${format.toUpperCase()} para projeto: ${projectData.title}`);
    
    // Em produção, aqui geraria o documento real usando uma biblioteca como PDFKit ou similar
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // URL de exemplo para o documento gerado
    const fileName = `${projectData.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format}`;
    const mockUrl = `https://example.com/exports/${fileName}`;
    
    // Em produção, faríamos upload do arquivo para o Supabase Storage
    
    return new Response(JSON.stringify({
      success: true,
      documentName: fileName,
      url: mockUrl,
      format,
      projectId,
      generatedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('[export-document] Erro:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro desconhecido durante a exportação do documento'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
