
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import LogoPT2030 from '@/components/LogoPT2030';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Clear errors when inputs change
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Por favor preencha todos os campos.");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First try signing in normally
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        console.log("Sign in error:", signInError);
        
        // If error is "Email not confirmed", try signup to bypass confirmation
        if (signInError.message?.includes('Email not confirmed')) {
          console.log("Email not confirmed, trying to sign up to bypass confirmation...");
          
          // Try signing up (this will work without email confirmation in dev)
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/login`
            }
          });
          
          if (signUpError) {
            console.error("Sign up error:", signUpError);
            setError(signUpError.message || "Erro ao tentar fazer login. Verifique suas credenciais.");
          } else {
            // Try logging in again after signup
            const { error: secondSignInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (secondSignInError) {
              console.error("Second sign in error:", secondSignInError);
              setError(secondSignInError.message || "Erro ao fazer login após registro.");
            } else {
              // Success!
              toast({
                title: "Login bem sucedido",
                description: "Bem-vindo à plataforma PT2030!",
              });
              navigate('/');
            }
          }
        } else {
          // Handle other errors
          setError(signInError.message || "Falha na autenticação. Verifique suas credenciais.");
        }
      } else {
        // Success on first try!
        toast({
          title: "Login bem sucedido",
          description: "Bem-vindo à plataforma PT2030!",
        });
        navigate('/');
      }
    } catch (err) {
      console.error("Unexpected error during authentication:", err);
      setError("Ocorreu um erro inesperado. Por favor tente novamente.");
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
          </CardHeader>
          
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={handleInputChange(setEmail)}
                  required
                  disabled={loading}
                  className={error ? "border-red-300 focus:border-red-500" : ""}
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
                    onChange={handleInputChange(setPassword)}
                    required
                    disabled={loading}
                    className={error ? "border-red-300 focus:border-red-500" : ""}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
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
                disabled={loading}
              >
                {loading ? "A autenticar..." : "Entrar"}
              </Button>
              
              <p className="text-center text-sm text-gray-600">
                Não tem conta?{" "}
                <Link to="/register" className="font-medium text-pt-blue hover:underline">
                  Registar
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
