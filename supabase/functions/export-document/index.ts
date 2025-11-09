
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0'
import PDFDocument from 'https://esm.sh/pdfkit@0.13.0'
import { withSentry, trackSpan } from '../_shared/sentry.ts'

// Configurar cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to format dates
function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

// Helper function to generate PDF
async function generatePDF(project: any, sections: any[], language: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      })

      const chunks: Uint8Array[] = []

      doc.on('data', (chunk: Uint8Array) => chunks.push(chunk))
      doc.on('end', () => {
        const result = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
        let offset = 0
        for (const chunk of chunks) {
          result.set(chunk, offset)
          offset += chunk.length
        }
        resolve(result)
      })
      doc.on('error', reject)

      // Title Page
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text(project.title || 'Projeto', { align: 'center' })
         .moveDown(2)

      // Project metadata
      doc.fontSize(12)
         .font('Helvetica')

      if (project.organization) {
        doc.text(`Organização: ${project.organization}`, { align: 'center' })
           .moveDown(0.5)
      }

      if (project.budget) {
        const budget = typeof project.budget === 'number'
          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'EUR' }).format(project.budget)
          : project.budget
        doc.text(`Orçamento: ${budget}`, { align: 'center' })
           .moveDown(0.5)
      }

      if (project.start_date) {
        doc.text(`Data de Início: ${formatDate(project.start_date)}`, { align: 'center' })
           .moveDown(0.5)
      }

      if (project.end_date) {
        doc.text(`Data de Fim: ${formatDate(project.end_date)}`, { align: 'center' })
           .moveDown(0.5)
      }

      doc.moveDown(2)
         .fontSize(10)
         .text(`Documento gerado em ${formatDate(new Date())}`, { align: 'center' })
         .moveDown(2)

      // Add description if available
      if (project.description) {
        doc.addPage()
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('Descrição do Projeto', { underline: true })
           .moveDown(1)
           .fontSize(11)
           .font('Helvetica')
           .text(stripHtml(project.description), { align: 'justify' })
           .moveDown(2)
      }

      // Add sections
      if (sections && sections.length > 0) {
        sections.forEach((section, index) => {
          // Add new page for each section except the first one if we have description
          if (index > 0 || !project.description) {
            doc.addPage()
          } else {
            doc.moveDown(2)
          }

          // Section title
          doc.fontSize(16)
             .font('Helvetica-Bold')
             .text(section.title || `Seção ${index + 1}`, { underline: true })
             .moveDown(1)

          // Section content
          const content = stripHtml(section.content || '')
          if (content) {
            doc.fontSize(11)
               .font('Helvetica')
               .text(content, { align: 'justify' })
          } else {
            doc.fontSize(10)
               .font('Helvetica-Oblique')
               .fillColor('#666666')
               .text('(Conteúdo não disponível)', { align: 'center' })
               .fillColor('#000000')
          }

          doc.moveDown(2)
        })
      }

      // Footer on last page
      const pageCount = doc.bufferedPageRange().count
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i)
        doc.fontSize(9)
           .font('Helvetica')
           .text(
             `Página ${i + 1} de ${pageCount}`,
             50,
             doc.page.height - 50,
             { align: 'center' }
           )
      }

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

// Função principal servida pela Edge Function
serve(withSentry(async (req) => {
  // Lidar com requests de preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    let projectId: string | null = null
    let format = 'pdf'
    let language = 'pt'
    let includeAttachments = false

    // Support both GET and POST methods
    if (req.method === 'GET') {
      // Obter parâmetros da URL (for direct browser access)
      const url = new URL(req.url)
      projectId = url.searchParams.get('projectId')
      format = url.searchParams.get('format') || 'pdf'
      language = url.searchParams.get('language') || 'pt'
      includeAttachments = url.searchParams.get('attachments') === 'true'
    } else if (req.method === 'POST') {
      // Obter parâmetros do body (for programmatic access via supabase.functions.invoke)
      const body = await req.json()
      projectId = body.projectId
      format = body.format || 'pdf'
      language = body.language || 'pt'
      includeAttachments = body.includeAttachments === true
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Método não permitido. Use GET ou POST' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar input
    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: 'projectId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar formato
    if (format !== 'pdf') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Apenas o formato PDF é suportado atualmente'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Obter dados do projeto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) {
      throw new Error(`Erro ao buscar projeto: ${projectError.message}`)
    }

    if (!project) {
      throw new Error('Projeto não encontrado')
    }

    // 2. Obter seções do projeto
    const { data: sections, error: sectionsError } = await supabase
      .from('sections')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (sectionsError) {
      throw new Error(`Erro ao buscar seções: ${sectionsError.message}`)
    }

    // 3. Obter anexos se necessário
    let attachments = []
    if (includeAttachments) {
      const { data: files, error: filesError } = await supabase
        .from('indexed_files')
        .select('*')
        .eq('project_id', projectId)

      if (filesError) {
        console.warn('Erro ao buscar anexos:', filesError.message)
      } else {
        attachments = files || []
      }
    }

    // 4. Gerar PDF
    console.log(`Gerando PDF para projeto ${projectId}...`)
    const pdfBuffer = await generatePDF(project, sections || [], language)
    console.log(`PDF gerado com sucesso. Tamanho: ${pdfBuffer.length} bytes`)

    // 5. Upload para Supabase Storage
    const fileName = `projeto-${projectId}-${Date.now()}.pdf`
    const filePath = `exports/${fileName}`

    // Criar bucket se não existir (será ignorado se já existir)
    try {
      await supabase.storage.createBucket('exports', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['application/pdf']
      })
    } catch (bucketError) {
      // Bucket já existe, continuar
      console.log('Bucket já existe ou erro ao criar:', bucketError)
    }

    // Upload do arquivo
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exports')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Erro ao fazer upload do PDF: ${uploadError.message}`)
    }

    console.log(`PDF enviado com sucesso: ${filePath}`)

    // 6. Gerar URL assinada (válida por 1 hora)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('exports')
      .createSignedUrl(filePath, 3600)

    if (signedUrlError) {
      throw new Error(`Erro ao criar URL assinada: ${signedUrlError.message}`)
    }

    // 7. Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        url: signedUrlData.signedUrl,
        fileName: fileName,
        format: format,
        sections: (sections || []).length,
        attachments: attachments.length,
        metadata: {
          projectName: project.title,
          exportDate: new Date().toISOString(),
          pageCount: 1 + (project.description ? 1 : 0) + (sections || []).length,
          language: language,
          fileSize: pdfBuffer.length
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erro na exportação:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}))
