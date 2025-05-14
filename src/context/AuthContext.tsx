
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null, emailNotConfirmed?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up the auth state listener first to avoid missing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession);
        
        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          toast({
            title: "Login bem sucedido",
            description: "Bem-vindo à plataforma PT2030!",
          });
          navigate('/');
        } else if (event === 'SIGNED_OUT') {
          toast({
            title: "Sessão terminada",
            description: "A sua sessão foi terminada com sucesso.",
          });
          navigate('/login');
        } else if (event === 'USER_UPDATED') {
          toast({
            title: "Utilizador atualizado",
            description: "Os seus dados foram atualizados com sucesso.",
          });
        }
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // Check for initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log("Initial session check:", initialSession ? "Found session" : "No session");
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);
      
      // If user has a session, navigate to dashboard
      if (initialSession?.user) {
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });
      
      if (!error) {
        toast({
          title: "Conta criada com sucesso",
          description: "Por favor verifique o seu email para confirmar a sua conta.",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Erro ao registar:', error);
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        // Type guard for AuthError
        const isAuthError = (err: Error | AuthError): err is AuthError => 
          'status' in err;
        
        if (isAuthError(error) && error.message?.includes('Email not confirmed')) {
          console.log("Email not confirmed error detected");
          
          // Automatically send another confirmation email
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/login`,
            }
          });
          
          if (!resendError) {
            toast({
              title: "Email de confirmação enviado",
              description: "Um novo email de confirmação foi enviado. Por favor verifique a sua caixa de entrada.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erro ao enviar email",
              description: resendError.message || "Não foi possível enviar o email. Tente novamente mais tarde."
            });
          }
          
          return { error, emailNotConfirmed: true };
        }
        
        return { error };
      }
      
      // Success is handled by the onAuthStateChange listener
      return { error: null };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Redirect is handled by onAuthStateChange listener
    } catch (error) {
      console.error('Erro ao terminar sessão:', error);
      toast({
        variant: "destructive",
        title: "Erro ao terminar sessão",
        description: "Ocorreu um erro ao terminar a sua sessão.",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (!error) {
        toast({
          title: "Email enviado",
          description: "Verifique o seu email para redefinir a sua password.",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Erro ao redefinir password:', error);
      return { error: error as Error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
