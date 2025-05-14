
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import LogoPT2030 from '@/components/LogoPT2030';
import Layout from '@/components/Layout';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast({
        title: "Login com sucesso",
        description: "Bem-vindo de volta ao Portal PT2030.",
      });
      navigate('/');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: error.message || "Credenciais incorretas. Por favor tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="pt-container pt-section flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="mb-4">
              <LogoPT2030 />
            </div>
            <CardTitle className="text-2xl text-pt-blue">Bem-vindo de volta</CardTitle>
            <CardDescription>
              Entre com o seu email e password para aceder à sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    placeholder="seu.email@exemplo.pt" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link 
                      to="/recuperar-password" 
                      className="text-sm text-pt-blue hover:text-pt-green"
                    >
                      Esqueceu a password?
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    placeholder="••••••••" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  className="w-full bg-pt-blue hover:bg-pt-blue/90" 
                  type="submit" 
                  disabled={isLoading}
                >
                  {isLoading ? "A entrar..." : "Entrar"}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-center w-full text-sm">
              Não tem conta?{" "}
              <Link to="/register" className="text-pt-blue hover:text-pt-green font-medium">
                Criar conta
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default LoginPage;
