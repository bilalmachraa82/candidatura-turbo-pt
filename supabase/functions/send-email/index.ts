
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { Resend } from 'npm:resend@3.2.0'

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email template types
type EmailTemplate = 'project_shared' | 'deadline_reminder' | 'export_ready' | 'validation_issues' | 'welcome'

// Template data types
interface ProjectSharedData {
  sharedBy: string
  projectName: string
  projectUrl: string
  recipientName?: string
}

interface DeadlineReminderData {
  projectName: string
  daysUntilDeadline: number
  deadline: string
  projectUrl: string
  recipientName?: string
}

interface ExportReadyData {
  projectName: string
  downloadUrl: string
  expiresIn: string
  recipientName?: string
}

interface ValidationIssuesData {
  projectName: string
  issueCount: number
  criticalCount: number
  projectUrl: string
  issues: Array<{ section: string; message: string; severity: string }>
  recipientName?: string
}

interface WelcomeData {
  userName: string
  loginUrl: string
}

type TemplateData = ProjectSharedData | DeadlineReminderData | ExportReadyData | ValidationIssuesData | WelcomeData

// Email template generator
const templates: Record<EmailTemplate, (data: any) => { subject: string; html: string }> = {
  project_shared: (data: ProjectSharedData) => ({
    subject: `${data.sharedBy} partilhou um projeto contigo`,
    html: `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Projeto Partilhado</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Projeto Partilhado</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                      Olá${data.recipientName ? ` ${data.recipientName}` : ''},
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                      <strong>${data.sharedBy}</strong> partilhou o projeto <strong>"${data.projectName}"</strong> contigo.
                    </p>
                    <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #666666;">
                      Podes agora colaborar, editar e gerir este projeto em conjunto.
                    </p>
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 0;">
                          <a href="${data.projectUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Ver Projeto</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #666666;">
                      Este é um email automático da plataforma de gestão de candidaturas.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                      Se não reconheces esta ação, podes ignorar este email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }),

  deadline_reminder: (data: DeadlineReminderData) => {
    const urgencyColor = data.daysUntilDeadline <= 1 ? '#dc2626' : data.daysUntilDeadline <= 3 ? '#ea580c' : '#0891b2'
    const urgencyText = data.daysUntilDeadline === 1 ? 'Amanhã' : data.daysUntilDeadline === 0 ? 'Hoje' : `${data.daysUntilDeadline} dias`

    return {
      subject: `Lembrete: Prazo do projeto "${data.projectName}" ${data.daysUntilDeadline <= 1 ? 'termina em breve' : `em ${data.daysUntilDeadline} dias`}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Lembrete de Prazo</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: ${urgencyColor}; border-radius: 8px 8px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">⏰ Lembrete de Prazo</h1>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                        Olá${data.recipientName ? ` ${data.recipientName}` : ''},
                      </p>
                      <div style="background-color: #fef3c7; border-left: 4px solid ${urgencyColor}; padding: 20px; margin: 0 0 20px 0; border-radius: 4px;">
                        <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #92400e;">
                          O prazo do projeto "${data.projectName}" termina em ${urgencyText}
                        </p>
                        <p style="margin: 0; font-size: 16px; color: #78350f;">
                          Data limite: <strong>${data.deadline}</strong>
                        </p>
                      </div>
                      <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #666666;">
                        Certifica-te de que todas as secções estão completas e revê o conteúdo antes da submissão final.
                      </p>
                      <!-- CTA Button -->
                      <table role="presentation" style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td align="center" style="padding: 0;">
                            <a href="${data.projectUrl}" style="display: inline-block; padding: 14px 40px; background-color: ${urgencyColor}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Abrir Projeto</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                      <p style="margin: 0; font-size: 14px; color: #666666;">
                        Este é um lembrete automático configurado nas preferências do projeto.
                      </p>
                      <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                        Podes gerir as tuas notificações nas definições.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    }
  },

  export_ready: (data: ExportReadyData) => ({
    subject: `Exportação do projeto "${data.projectName}" concluída`,
    html: `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Exportação Pronta</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">✓ Exportação Concluída</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                      Olá${data.recipientName ? ` ${data.recipientName}` : ''},
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                      A exportação em PDF do projeto <strong>"${data.projectName}"</strong> foi concluída com sucesso!
                    </p>
                    <div style="background-color: #dcfce7; border-left: 4px solid #10b981; padding: 20px; margin: 0 0 20px 0; border-radius: 4px;">
                      <p style="margin: 0; font-size: 14px; color: #166534;">
                        📄 O teu documento está pronto para download.<br>
                        ⏱️ Este link expira em <strong>${data.expiresIn}</strong>.
                      </p>
                    </div>
                    <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #666666;">
                      Clica no botão abaixo para fazer o download do ficheiro PDF.
                    </p>
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 0;">
                          <a href="${data.downloadUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Descarregar PDF</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #666666;">
                      Este é um email automático da plataforma de gestão de candidaturas.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                      Se não solicitaste esta exportação, podes ignorar este email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }),

  validation_issues: (data: ValidationIssuesData) => ({
    subject: `Problemas detetados no projeto "${data.projectName}"`,
    html: `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Problemas de Validação</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background-color: #dc2626; border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">⚠️ Problemas Detetados</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                      Olá${data.recipientName ? ` ${data.recipientName}` : ''},
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                      A validação automática detetou alguns problemas no projeto <strong>"${data.projectName}"</strong>.
                    </p>
                    <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; margin: 0 0 20px 0; border-radius: 4px;">
                      <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #991b1b;">
                        Total de problemas: ${data.issueCount}
                      </p>
                      <p style="margin: 0; font-size: 14px; color: #991b1b;">
                        Críticos: <strong>${data.criticalCount}</strong>
                      </p>
                    </div>
                    ${data.issues.length > 0 ? `
                      <p style="margin: 0 0 15px 0; font-size: 16px; font-weight: bold; color: #333333;">
                        Problemas principais:
                      </p>
                      <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 20px 0;">
                        ${data.issues.slice(0, 5).map(issue => `
                          <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
                              <p style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: ${issue.severity === 'critical' ? '#dc2626' : '#ea580c'};">
                                ${issue.section}
                              </p>
                              <p style="margin: 0; font-size: 13px; color: #666666;">
                                ${issue.message}
                              </p>
                            </td>
                          </tr>
                        `).join('')}
                      </table>
                    ` : ''}
                    <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #666666;">
                      Recomendamos que corrijas estes problemas antes de submeter o projeto.
                    </p>
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 0;">
                          <a href="${data.projectUrl}" style="display: inline-block; padding: 14px 40px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Ver e Corrigir</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #666666;">
                      Este é um email automático de validação com IA.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                      Podes gerir as tuas notificações nas definições.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }),

  welcome: (data: WelcomeData) => ({
    subject: 'Bem-vindo à Plataforma de Gestão de Candidaturas',
    html: `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">Bem-vindo!</h1>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 28px; color: #333333;">
                      Olá <strong>${data.userName}</strong>,
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #333333;">
                      Bem-vindo à Plataforma de Gestão de Candidaturas! Estamos muito contentes por te teres juntado a nós.
                    </p>
                    <div style="background-color: #ede9fe; border-left: 4px solid #7c3aed; padding: 20px; margin: 0 0 20px 0; border-radius: 4px;">
                      <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #5b21b6;">
                        O que podes fazer na plataforma:
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #5b21b6;">
                        <li style="margin: 8px 0;">Criar e gerir projetos de candidatura</li>
                        <li style="margin: 8px 0;">Colaborar com a tua equipa em tempo real</li>
                        <li style="margin: 8px 0;">Usar IA para melhorar o conteúdo</li>
                        <li style="margin: 8px 0;">Exportar documentos em PDF</li>
                        <li style="margin: 8px 0;">Gerir prazos e receber lembretes</li>
                      </ul>
                    </div>
                    <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 24px; color: #666666;">
                      Estamos aqui para te ajudar a criar candidaturas de sucesso. Vamos começar!
                    </p>
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 0;">
                          <a href="${data.loginUrl}" style="display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Começar Agora</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #666666;">
                      Se precisares de ajuda, consulta a nossa documentação ou contacta o suporte.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #999999;">
                      Plataforma de Gestão de Candidaturas - ${new Date().getFullYear()}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  })
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { to, template, data, from } = await req.json()

    // Validate inputs
    if (!to || !template || !data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: to, template, data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate template
    if (!templates[template as EmailTemplate]) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid template. Valid templates: ${Object.keys(templates).join(', ')}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey)

    // Generate email from template
    const emailContent = templates[template as EmailTemplate](data)

    // Send email
    const result = await resend.emails.send({
      from: from || 'Candidaturas <noreply@candidaturas.pt>',
      to: Array.isArray(to) ? to : [to],
      subject: emailContent.subject,
      html: emailContent.html,
    })

    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id,
        template,
        recipient: to
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending email:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send email'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
