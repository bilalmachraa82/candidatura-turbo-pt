import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import { getRoleDisplayName, getRoleBadgeColor } from '@/lib/permissions';
import { analytics } from '@/lib/analytics';
import { CheckCircle, XCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

interface Invitation {
  id: string;
  project_id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
  project?: {
    id: string;
    title: string;
    description: string | null;
  };
  inviter?: {
    full_name: string | null;
    email: string;
  };
}

const AcceptInvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      fetchInvitation();
    }
  }, [token, authLoading]);

  const fetchInvitation = async () => {
    if (!token) {
      setError('Token de convite inválido');
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('project_invitations')
        .select(
          `
          *,
          project:project_id (
            id,
            title,
            description
          ),
          inviter:invited_by (
            full_name,
            email
          )
        `
        )
        .eq('token', token)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Convite não encontrado ou já foi utilizado');
        } else {
          throw fetchError;
        }
        setLoading(false);
        return;
      }

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        setError('Este convite expirou');
        setLoading(false);
        return;
      }

      setInvitation(data as Invitation);
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError('Erro ao carregar o convite');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = `/invite/${token}`;
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (!invitation) return;

    // Check if user's email matches the invitation
    if (user.email !== invitation.email) {
      toast({
        variant: 'destructive',
        title: 'Email não corresponde',
        description: `Este convite foi enviado para ${invitation.email}. Por favor, faz login com essa conta.`,
      });
      return;
    }

    setProcessing(true);

    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', invitation.project_id)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        toast({
          variant: 'destructive',
          title: 'Já és membro',
          description: 'Já és membro deste projeto.',
        });
        // Delete the invitation
        await supabase.from('project_invitations').delete().eq('id', invitation.id);
        navigate(`/projects/${invitation.project_id}`);
        return;
      }

      // Create project member record
      const { error: memberError } = await supabase.from('project_members').insert({
        project_id: invitation.project_id,
        user_id: user.id,
        role: invitation.role,
        invited_by: invitation.invited_by,
        invited_at: invitation.created_at,
        accepted_at: new Date().toISOString(),
      });

      if (memberError) throw memberError;

      // Delete the invitation
      const { error: deleteError } = await supabase
        .from('project_invitations')
        .delete()
        .eq('id', invitation.id);

      if (deleteError) {
        console.error('Error deleting invitation:', deleteError);
        // Don't fail the whole operation
      }

      analytics.featureUsed('invitation_accepted', {
        role: invitation.role,
        projectId: invitation.project_id,
      });

      toast({
        title: 'Convite aceite',
        description: `Bem-vindo ao projeto "${invitation.project?.title}"!`,
      });

      // Redirect to project
      navigate(`/projects/${invitation.project_id}`);
    } catch (err) {
      console.error('Error accepting invitation:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível aceitar o convite.',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) return;

    setProcessing(true);

    try {
      const { error: deleteError } = await supabase
        .from('project_invitations')
        .delete()
        .eq('id', invitation.id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Convite recusado',
        description: 'O convite foi recusado.',
      });

      navigate('/dashboard');
    } catch (err) {
      console.error('Error declining invitation:', err);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível recusar o convite.',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-pt-green" />
            <p className="mt-4 text-gray-600">A carregar convite...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Convite Inválido</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/dashboard')} variant="outline">
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!invitation) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Convite não encontrado</p>
          </div>
        </div>
      </Layout>
    );
  }

  const inviterName =
    invitation.inviter?.full_name || invitation.inviter?.email || 'Um colega';

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-pt-green/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-pt-green" />
            </div>
            <CardTitle className="text-2xl">Convite para Colaborar</CardTitle>
            <CardDescription>
              Foste convidado para participar num projeto PT2030
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Invitation details */}
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Projeto</p>
                <h3 className="text-xl font-semibold text-gray-900">
                  {invitation.project?.title}
                </h3>
                {invitation.project?.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {invitation.project.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Convidado por</p>
                  <p className="font-medium text-gray-900">{inviterName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Papel</p>
                  <Badge className={getRoleBadgeColor(invitation.role)}>
                    {getRoleDisplayName(invitation.role)}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Permissions info */}
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">
                Como {getRoleDisplayName(invitation.role)}, terás as seguintes permissões:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                {invitation.role === 'admin' && (
                  <>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-pt-green mr-2 mt-0.5 flex-shrink-0" />
                      <span>Editar todo o conteúdo do projeto</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-pt-green mr-2 mt-0.5 flex-shrink-0" />
                      <span>Fazer upload e gerir documentos</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-pt-green mr-2 mt-0.5 flex-shrink-0" />
                      <span>Gerar conteúdo com IA</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-pt-green mr-2 mt-0.5 flex-shrink-0" />
                      <span>Gerir membros da equipa</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-pt-green mr-2 mt-0.5 flex-shrink-0" />
                      <span>Exportar o dossiê</span>
                    </li>
                  </>
                )}
                {invitation.role === 'editor' && (
                  <>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-pt-green mr-2 mt-0.5 flex-shrink-0" />
                      <span>Editar todo o conteúdo do projeto</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-pt-green mr-2 mt-0.5 flex-shrink-0" />
                      <span>Fazer upload e gerir documentos</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-pt-green mr-2 mt-0.5 flex-shrink-0" />
                      <span>Gerar conteúdo com IA</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-pt-green mr-2 mt-0.5 flex-shrink-0" />
                      <span>Exportar o dossiê</span>
                    </li>
                  </>
                )}
                {invitation.role === 'viewer' && (
                  <>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-pt-green mr-2 mt-0.5 flex-shrink-0" />
                      <span>Visualizar o projeto</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-pt-green mr-2 mt-0.5 flex-shrink-0" />
                      <span>Adicionar comentários</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-pt-green mr-2 mt-0.5 flex-shrink-0" />
                      <span>Exportar o dossiê</span>
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Expiration warning */}
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-amber-50 p-3 rounded-lg">
              <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>
                Este convite expira em{' '}
                {new Date(invitation.expires_at).toLocaleDateString('pt-PT', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {/* Login warning if not authenticated */}
            {!user && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Precisas de ter sessão iniciada para aceitar este convite. Serás
                  redirecionado para a página de login.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleAccept}
                disabled={processing}
                className="flex-1 bg-pt-green hover:bg-pt-green/90"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    A processar...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aceitar Convite
                  </>
                )}
              </Button>
              <Button
                onClick={handleDecline}
                disabled={processing}
                variant="outline"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Recusar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AcceptInvitePage;
