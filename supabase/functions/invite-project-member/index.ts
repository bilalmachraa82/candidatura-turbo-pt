import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteRequest {
  projectId: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the user from the auth token
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Parse the request body
    const { projectId, email, role }: InviteRequest = await req.json();

    // Validate input
    if (!projectId || !email || !role) {
      throw new Error('Missing required fields: projectId, email, role');
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      throw new Error('Invalid role. Must be admin, editor, or viewer');
    }

    if (!email.includes('@')) {
      throw new Error('Invalid email address');
    }

    // Check if user has permission to invite members
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id, title')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    const isOwner = project.user_id === user.id;

    // Check if user is owner or admin
    const { data: membership } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    const canInvite = isOwner || membership?.role === 'admin';

    if (!canInvite) {
      throw new Error('You do not have permission to invite members to this project');
    }

    // Check if the email is already a member
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        throw new Error('User is already a member of this project');
      }
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('project_invitations')
      .select('id')
      .eq('project_id', projectId)
      .eq('email', email)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      throw new Error('There is already a pending invitation for this email');
    }

    // Generate a unique token
    const token_value = crypto.randomUUID();

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('project_invitations')
      .insert({
        project_id: projectId,
        email,
        role,
        invited_by: user.id,
        token: token_value,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    // Get inviter's profile
    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const inviterName = inviterProfile?.full_name || inviterProfile?.email || 'Um colega';

    // Send email notification
    const inviteUrl = `${req.headers.get('origin') || 'https://pt2030.app'}/invite/${token_value}`;

    const roleNames: Record<string, string> = {
      admin: 'Administrador',
      editor: 'Editor',
      viewer: 'Visualizador',
    };

    const emailBody = {
      to: email,
      subject: `Convite para colaborar no projeto "${project.title}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite para Projeto PT2030</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #00A651 0%, #008B44 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">PT2030</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Candidaturas Inteligentes</p>
          </div>

          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #00A651; margin-top: 0;">Convite para Colaborar</h2>

            <p>Olá!</p>

            <p><strong>${inviterName}</strong> convidou-te para colaborar no projeto:</p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #111827;">${project.title}</h3>
              <p style="margin: 0; color: #6b7280;">Papel: <strong style="color: #00A651;">${roleNames[role]}</strong></p>
            </div>

            <p>Como <strong>${roleNames[role]}</strong>, terás as seguintes permissões:</p>

            <ul style="color: #6b7280;">
              ${
                role === 'admin'
                  ? `
                <li>Editar todo o conteúdo do projeto</li>
                <li>Fazer upload e gerir documentos</li>
                <li>Gerar conteúdo com IA</li>
                <li>Gerir membros da equipa</li>
                <li>Exportar o dossiê</li>
              `
                  : role === 'editor'
                  ? `
                <li>Editar todo o conteúdo do projeto</li>
                <li>Fazer upload e gerir documentos</li>
                <li>Gerar conteúdo com IA</li>
                <li>Exportar o dossiê</li>
              `
                  : `
                <li>Visualizar o projeto</li>
                <li>Adicionar comentários</li>
                <li>Exportar o dossiê</li>
              `
              }
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}"
                 style="background: #00A651; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Aceitar Convite
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              Este convite expira em 7 dias. Se não consegues clicar no botão, copia e cola este link no teu navegador:
            </p>
            <p style="color: #6b7280; font-size: 12px; word-break: break-all; background: #f9fafb; padding: 10px; border-radius: 4px;">
              ${inviteUrl}
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} PT2030. Todos os direitos reservados.</p>
          </div>
        </body>
        </html>
      `,
    };

    // Call send-email function
    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: emailBody,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the whole operation if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation,
        message: 'Invitation sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in invite-project-member function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
