import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import LogoPT2030 from '@/components/LogoPT2030';
import SupabaseConnectionStatus from '@/components/SupabaseConnectionStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthError } from '@supabase/supabase-js';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const { toast } = useToast();

  // Limpar erros quando o usuário corrige os campos
  useEffect(() => {
    if (authError) {
      setAuthError(null);
    }
  }, [email, password]);

  const handleSupabaseStatusChange = (status: boolean) => {
    setIsSupabaseConnected(status);
    if (status) {
      // Se reconectar, limpar mensagem de serviço indisponível
      setServiceUnavailable(false);
    }
  };

  // Helper function to type check if the error is an AuthError
  const isAuthError = (error: Error | AuthError): error is AuthError => {
    return 'status' in error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConnected) {
      toast({
        variant: "destructive",
        title: "Erro de ligação",
        description: serviceUnavailable 
          ? "O serviço Supabase está temporariamente indisponível. Por favor, tente novamente mais tarde."
          : "Não é possível fazer login enquanto o Supabase não estiver conectado.",
      });
      return;
    }
    
    if (!email || !password) {
      setAuthError("Por favor preencha todos os campos.");
      return;
    }
    
    setLoading(true);
    
    try {
      const { error, emailNotConfirmed } = await signIn(email, password);
      
      if (error) {
        console.log("Erro de autenticação:", error);
        
        if (error.message?.includes('Service unavailable') || 
            (isAuthError(error) && error.status === 503)) {
          setServiceUnavailable(true);
          setAuthError("O serviço Supabase está temporariamente indisponível. Por favor, tente novamente mais tarde.");
        } else if (error.message?.includes('Invalid login credentials')) {
          setAuthError("Credenciais inválidas. Por favor verifique seu email e senha.");
        } else if (error.message?.includes('Email not confirmed')) {
          // This is now handled in the AuthContext with the workaround
          setAuthError("A entrar no sistema sem confirmação de email...");
          setTimeout(() => {
            // Retry login after a short delay
            handleSubmit(e);
          }, 1500);
        } else {
          setAuthError(error.message || "Ocorreu um erro durante a autenticação. Por favor tente novamente.");
        }
      } else if (emailNotConfirmed) {
        // Successfully logged in with the email not confirmed workaround
        toast({
          title: "Login bem sucedido",
          description: "Bem-vindo ao sistema!",
        });
      }
    } catch (err) {
      console.error("Erro durante login:", err);
      setAuthError("Ocorreu um erro inesperado. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <LogoPT2030 />
          <h2 className="mt-6 text-center text-3xl font-bold text-pt-blue">
            Candidaturas PT2030
          </h2>
        </div>
        
        <Card className="border-2 border-pt-green/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Aceda à sua conta para gerir as candidaturas
            </CardDescription>
            <div className="mt-2 flex justify-center">
              <SupabaseConnectionStatus 
                onStatusChange={handleSupabaseStatusChange}
              />
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {authError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || !isSupabaseConnected || serviceUnavailable}
                  className={authError ? "border-red-300 focus:border-red-500" : ""}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/reset-password" className="text-xs text-pt-blue hover:underline">
                    Esqueceu a password?
                  </Link>
                </div>
                <div className="relative">
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading || !isSupabaseConnected || serviceUnavailable}
                    className={authError ? "border-red-300 focus:border-red-500" : ""}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || !isSupabaseConnected || serviceUnavailable}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-pt-green hover:bg-pt-green/90"
                disabled={loading || !isSupabaseConnected || serviceUnavailable}
              >
                {loading ? "A autenticar..." : "Entrar"}
              </Button>
              
              <p className="text-center text-sm text-gray-600">
                Não tem conta?{" "}
                <Link to="/register" className="font-medium text-pt-blue hover:underline">
                  Registar
                </Link>
              </p>
              
              {!isSupabaseConnected && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                  <p className="font-semibold">
                    {serviceUnavailable 
                      ? "Serviço Supabase Indisponível" 
                      : "Configuração necessária:"}
                  </p>
                  <p>
                    {serviceUnavailable 
                      ? "O serviço Supabase está temporariamente indisponível. Por favor, tente novamente mais tarde."
                      : "Para usar esta aplicação, substitua os valores em .env com as suas credenciais Supabase."}
                  </p>
                </div>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
