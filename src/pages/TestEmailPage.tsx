import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Loader2, Mail, Send } from 'lucide-react'

type EmailTemplate = 'project_shared' | 'deadline_reminder' | 'export_ready' | 'validation_issues' | 'welcome'

interface TemplateField {
  name: string
  label: string
  type: 'text' | 'number' | 'url' | 'textarea'
  placeholder?: string
  required?: boolean
}

const templateFields: Record<EmailTemplate, TemplateField[]> = {
  project_shared: [
    { name: 'sharedBy', label: 'Partilhado por', type: 'text', placeholder: 'João Silva', required: true },
    { name: 'projectName', label: 'Nome do Projeto', type: 'text', placeholder: 'Projeto PT2030', required: true },
    { name: 'projectUrl', label: 'URL do Projeto', type: 'url', placeholder: 'https://...', required: true },
    { name: 'recipientName', label: 'Nome do Destinatário', type: 'text', placeholder: 'Maria Santos' }
  ],
  deadline_reminder: [
    { name: 'projectName', label: 'Nome do Projeto', type: 'text', placeholder: 'Projeto PT2030', required: true },
    { name: 'daysUntilDeadline', label: 'Dias até ao Prazo', type: 'number', placeholder: '7', required: true },
    { name: 'deadline', label: 'Data Limite', type: 'text', placeholder: '31 de dezembro de 2025', required: true },
    { name: 'projectUrl', label: 'URL do Projeto', type: 'url', placeholder: 'https://...', required: true },
    { name: 'recipientName', label: 'Nome do Destinatário', type: 'text', placeholder: 'Maria Santos' }
  ],
  export_ready: [
    { name: 'projectName', label: 'Nome do Projeto', type: 'text', placeholder: 'Projeto PT2030', required: true },
    { name: 'downloadUrl', label: 'URL de Download', type: 'url', placeholder: 'https://...', required: true },
    { name: 'expiresIn', label: 'Expira em', type: 'text', placeholder: '1 hora', required: true },
    { name: 'recipientName', label: 'Nome do Destinatário', type: 'text', placeholder: 'Maria Santos' }
  ],
  validation_issues: [
    { name: 'projectName', label: 'Nome do Projeto', type: 'text', placeholder: 'Projeto PT2030', required: true },
    { name: 'issueCount', label: 'Número de Problemas', type: 'number', placeholder: '5', required: true },
    { name: 'criticalCount', label: 'Problemas Críticos', type: 'number', placeholder: '2', required: true },
    { name: 'projectUrl', label: 'URL do Projeto', type: 'url', placeholder: 'https://...', required: true },
    { name: 'recipientName', label: 'Nome do Destinatário', type: 'text', placeholder: 'Maria Santos' }
  ],
  welcome: [
    { name: 'userName', label: 'Nome do Utilizador', type: 'text', placeholder: 'João Silva', required: true },
    { name: 'loginUrl', label: 'URL de Login', type: 'url', placeholder: 'https://...', required: true }
  ]
}

const templateDescriptions: Record<EmailTemplate, string> = {
  project_shared: 'Enviado quando alguém partilha um projeto contigo',
  deadline_reminder: 'Enviado 7, 3 e 1 dia antes do prazo do projeto',
  export_ready: 'Enviado quando a exportação em PDF está pronta',
  validation_issues: 'Enviado quando a validação com IA deteta problemas',
  welcome: 'Enviado quando um novo utilizador se regista'
}

export default function TestEmailPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate>('project_shared')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isSending, setIsSending] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const handleSendTest = async () => {
    if (!recipientEmail) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Por favor, insere um email de destinatário'
      })
      return
    }

    // Validate required fields
    const fields = templateFields[selectedTemplate]
    const missingFields = fields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label)

    if (missingFields.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios em falta',
        description: `Por favor, preenche: ${missingFields.join(', ')}`
      })
      return
    }

    setIsSending(true)
    setLastResult(null)

    try {
      // Prepare data based on template
      let templateData: any = { ...formData }

      // Special handling for validation_issues template
      if (selectedTemplate === 'validation_issues') {
        templateData.issues = [
          { section: 'Secção 1', message: 'Conteúdo muito curto', severity: 'critical' },
          { section: 'Secção 2', message: 'Faltam palavras-chave importantes', severity: 'warning' },
          { section: 'Secção 3', message: 'Formatação inconsistente', severity: 'info' }
        ]
      }

      // Send email via edge function
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: recipientEmail,
          template: selectedTemplate,
          data: templateData
        }
      })

      if (error) {
        throw error
      }

      setLastResult({
        success: true,
        message: `Email enviado com sucesso! ID: ${data?.messageId || 'N/A'}`
      })

      toast({
        title: 'Email enviado',
        description: `Email de teste enviado para ${recipientEmail}`
      })

    } catch (error) {
      console.error('Error sending test email:', error)

      setLastResult({
        success: false,
        message: `Erro ao enviar: ${(error as Error).message}`
      })

      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: (error as Error).message
      })
    } finally {
      setIsSending(false)
    }
  }

  const currentFields = templateFields[selectedTemplate]

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Teste de Emails</h1>
        <p className="text-muted-foreground">
          Testa os diferentes templates de email da plataforma
        </p>
      </div>

      <div className="grid gap-6">
        {/* Template Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configuração
            </CardTitle>
            <CardDescription>
              Seleciona o template e configura os dados de teste
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Template Selector */}
            <div className="space-y-2">
              <Label htmlFor="template">Template de Email</Label>
              <Select
                value={selectedTemplate}
                onValueChange={(value) => {
                  setSelectedTemplate(value as EmailTemplate)
                  setFormData({})
                }}
              >
                <SelectTrigger id="template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project_shared">Projeto Partilhado</SelectItem>
                  <SelectItem value="deadline_reminder">Lembrete de Prazo</SelectItem>
                  <SelectItem value="export_ready">Exportação Pronta</SelectItem>
                  <SelectItem value="validation_issues">Problemas de Validação</SelectItem>
                  <SelectItem value="welcome">Boas-vindas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {templateDescriptions[selectedTemplate]}
              </p>
            </div>

            {/* Recipient Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email de Destinatário *</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            {/* Dynamic Fields */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">Dados do Template</h3>
              {currentFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label} {field.required && '*'}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    />
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={(e) => {
                        const value = field.type === 'number'
                          ? parseInt(e.target.value) || 0
                          : e.target.value
                        handleFieldChange(field.name, value)
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Send Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleSendTest}
              disabled={isSending}
              className="w-full"
              size="lg"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A enviar...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Email de Teste
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Result */}
        {lastResult && (
          <Card className={lastResult.success ? 'border-green-500' : 'border-red-500'}>
            <CardHeader>
              <CardTitle className={lastResult.success ? 'text-green-600' : 'text-red-600'}>
                {lastResult.success ? 'Sucesso' : 'Erro'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-sm">{lastResult.message}</p>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><strong>1. Configuração:</strong> Certifica-te de que o RESEND_API_KEY está configurado nos secrets do Supabase</p>
            <p><strong>2. Desenvolvimento:</strong> Usa o domínio resend.dev para testes</p>
            <p><strong>3. Produção:</strong> Verifica o teu domínio em resend.com/domains</p>
            <p><strong>4. Templates:</strong> Os templates estão em português e otimizados para dispositivos móveis</p>
            <p><strong>5. Preferências:</strong> Em produção, os utilizadores podem gerir as suas preferências de email</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
