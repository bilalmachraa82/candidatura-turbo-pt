
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ArrowLeft } from 'lucide-react';
import Layout from '@/components/Layout';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      setIsEmailSent(true);
      toast({
        title: "Email enviado!",
        description: "Verifique a sua caixa de entrada para redefinir a palavra-passe."
      });
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      setError(error.message || 'Erro ao enviar email de recuperação');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-pt-blue">
              Recuperar Palavra-passe
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Introduza o seu email para receber as instruções
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center text-pt-blue">
                {isEmailSent ? 'Email Enviado' : 'Esqueceu a palavra-passe?'}
              </CardTitle>
              <CardDescription className="text-center">
                {isEmailSent 
                  ? 'Verifique a sua caixa de entrada e siga as instruções'
                  : 'Vamos enviar-lhe um link para redefinir a sua palavra-passe'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEmailSent ? (
                <div className="space-y-4">
                  <Alert>
                    <Mail className="h-4 w-4" />
                    <AlertDescription>
                      Foi enviado um email para <strong>{email}</strong> com as instruções para 
                      redefinir a sua palavra-passe.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="text-center space-y-4">
                    <p className="text-sm text-gray-600">
                      Não recebeu o email? Verifique a pasta de spam ou tente novamente.
                    </p>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEmailSent(false);
                        setEmail('');
                      }}
                      className="w-full"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-10"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-pt-green hover:bg-pt-blue"
                    disabled={isLoading}
                  >
                    {isLoading ? 'A enviar...' : 'Enviar Email de Recuperação'}
                  </Button>
                </form>
              )}

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-sm text-pt-green hover:text-pt-blue"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPasswordPage;
