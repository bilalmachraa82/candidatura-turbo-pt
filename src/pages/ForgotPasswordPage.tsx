
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import LogoPT2030 from '@/components/LogoPT2030';
import { useAuth } from '@/context/AuthContext';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    
    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Reset password error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-6">
            <LogoPT2030 width={200} />
          </div>
          <CardTitle className="text-2xl font-bold text-pt-blue">
            Recuperar Palavra-passe
          </CardTitle>
          <CardDescription>
            Introduza o seu email para receber instruções de recuperação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-pt-green hover:bg-pt-green/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "A enviar..." : "Enviar instruções"}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-green-600 mb-4">
                Enviámos um email para {email} com instruções para recuperar a sua palavra-passe.
              </p>
              <p className="text-gray-600">
                Verifique o seu email e siga as instruções.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link 
            to="/login"
            className="text-pt-blue font-medium hover:text-pt-green"
          >
            Voltar ao login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
