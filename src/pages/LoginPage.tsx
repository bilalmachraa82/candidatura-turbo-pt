
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import LogoPT2030 from '@/components/LogoPT2030';
import { AlertCircle, Loader2 } from 'lucide-react';

// Contador para prevenir loops infinitos
let loginAttempts = 0;
const MAX_LOGIN_ATTEMPTS = 5;

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { signIn, user, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Resetar contador de tentativas após 5 minutos
  useEffect(() => {
    const timer = setTimeout(() => {
      loginAttempts = 0;
    }, 5 * 60 * 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Obter o caminho que o usuário estava tentando acessar, ou padrão para home
  const from = location.state?.from || '/';
  
  // Efeito para redirecionamento automático quando usuário já está autenticado
  useEffect(() => {
    if (user && !isLoading) {
      console.log('User already authenticated, redirecting to:', from);
      
      // Usar um curto timeout para garantir que o estado de autenticação já foi atualizado
      const redirectTimer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, navigate, from, isLoading]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      setLoginError("Muitas tentativas de login. Tente novamente mais tarde.");
      return;
    }
    
    loginAttempts++;
    setIsSubmitting(true);
    setLoginError(null);
    
    try {
      if (!email || !password) {
        setLoginError('Email e senha são obrigatórios');
        setIsSubmitting(false);
        return;
      }
      
      const { success, error } = await signIn(email, password);
      
      if (success) {
        console.log('Login successful');
        // Não redirecionamos aqui - deixamos o efeito useEffect fazer isso
      } else {
        console.log('Login failed:', error);
        setLoginError(error?.message || 'Falha na autenticação. Verifique suas credenciais.');
      }
    } catch (error: any) {
      console.error('Exception during login:', error);
      setLoginError('Erro ao conectar ao serviço. Verifique sua conexão com a internet.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Mostrar indicador de carregamento enquanto o estado de autenticação está sendo verificado
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-pt-green mb-4" />
          <p className="text-gray-600">A verificar sessão...</p>
        </div>
      </div>
    );
  }
  
  // Renderizar o formulário de login apenas se não estiver autenticado
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-pt-green mb-4" />
          <p className="text-gray-600">A redirecionar...</p>
        </div>
      </div>
    );
  }
  
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
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-pt-green hover:bg-pt-green/90"
              disabled={isSubmitting || loginAttempts >= MAX_LOGIN_ATTEMPTS}
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
