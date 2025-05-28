
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

interface ExportRequest {
  projectId: string;
  format: 'pdf' | 'docx';
  language: 'pt' | 'en';
  sections?: string[];
}

interface ProjectData {
  id: string;
  title: string;
  description: string;
  created_at: string;
  sections: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, format, language, sections }: ExportRequest = await request.json();

    if (!projectId || !format) {
      return NextResponse.json(
        { error: 'ProjectId e formato são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar dados do projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', session.user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    // Buscar documentos anexados
    const { data: documents, error: docsError } = await supabase
      .from('project_documents')
      .select('*')
      .eq('project_id', projectId);

    // Preparar dados para exportação
    const exportData = {
      project,
      documents: documents || [],
      sections: sections || Object.keys(project.sections || {}),
      language,
      format
    };

    // Chamar a função Supabase Edge para exportação
    const { data: exportResult, error: exportError } = await supabase.functions.invoke(
      'export-document',
      {
        body: exportData
      }
    );

    if (exportError) {
      console.error('Export error:', exportError);
      return NextResponse.json(
        { error: 'Erro na exportação: ' + exportError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      downloadUrl: exportResult.downloadUrl,
      filename: exportResult.filename,
      format,
      size: exportResult.size
    });

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json(
      { error: 'ProjectId é obrigatório' },
      { status: 400 }
    );
  }

  try {
    // Verificar se o projeto tem conteúdo suficiente para exportação
    const { data: project, error } = await supabase
      .from('projects')
      .select('sections')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    const sections = project.sections || {};
    const completedSections = Object.keys(sections).filter(
      key => sections[key]?.content && sections[key].content.trim().length > 0
    );

    return NextResponse.json({
      ready: completedSections.length > 0,
      completedSections,
      totalSections: Object.keys(sections).length,
      completion: Math.round((completedSections.length / Math.max(Object.keys(sections).length, 1)) * 100)
    });

  } catch (error) {
    console.error('Export check error:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar estado da exportação' },
      { status: 500 }
    );
  }
}
