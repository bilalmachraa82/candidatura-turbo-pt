
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import LogoPT2030 from '@/components/LogoPT2030';
import { AlertCircle, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { signIn, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  
  // Use a ref to track if navigation has been attempted
  const navigationAttempted = useRef(false);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading && !navigationAttempted.current) {
      console.log('Utilizador já autenticado, redirecionando para a página inicial');
      navigationAttempted.current = true;
      navigate(from, { replace: true });
    }
  }, [user, navigate, from, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setLoginError(null);

    try {
      console.log('Tentando login com:', { email });
      
      if (!email || !password) {
        setLoginError('Email e senha são obrigatórios');
        setIsSubmitting(false);
        return;
      }

      const { success, error } = await signIn(email, password);
      
      if (success) {
        console.log('Login bem-sucedido, redirecionando...');
        navigationAttempted.current = true;
        navigate(from, { replace: true });
      } else {
        console.error('Falha no login:', error);
        setLoginError(error?.message || 'Falha na autenticação. Verifique suas credenciais.');
      }
    } catch (error: any) {
      console.error('Exceção durante login:', error);
      setLoginError('Erro ao conectar ao serviço. Verifique sua conexão com a internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-pt-green mb-4" />
          <p className="text-gray-600">A verificar sessão...</p>
        </div>
      </div>
    );
  }

  // Only render the login form if not authenticated
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-6">
            <LogoPT2030 />
          </div>
          <CardTitle className="text-2xl font-bold text-pt-blue">
            Iniciar sessão
          </CardTitle>
          <CardDescription>
            Aceda à sua conta para gerir as suas candidaturas PT2030
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 mb-4 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.pt"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="focus:ring-pt-green focus:border-pt-green"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Palavra-passe</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-pt-green hover:underline"
                >
                  Esqueceu-se da palavra-passe?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="focus:ring-pt-green focus:border-pt-green"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-pt-green hover:bg-pt-green/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A entrar...
                </>
              ) : "Entrar"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4">
          <p className="text-sm text-gray-600">
            Não tem conta?{" "}
            <Link to="/register" className="text-pt-green hover:underline">
              Registar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
