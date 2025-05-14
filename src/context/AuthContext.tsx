
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | Error | null }>;
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
  
  // Estado para evitar tentativas excessivas em caso de erro
  const [authAttemptInProgress, setAuthAttemptInProgress] = useState(false);

  useEffect(() => {
    // Setup auth state listener FIRST (to avoid missing auth events)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Eventos importantes podem ser registrados aqui
        if (event === 'SIGNED_OUT') {
          console.log("Usuário desconectado");
        } else if (event === 'SIGNED_IN') {
          console.log("Usuário conectado:", currentSession?.user?.email);
        } else if (event === 'TOKEN_REFRESHED') {
          console.log("Token atualizado");
        }
        
        setLoading(false);
      }
    );
    
    // THEN check for initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        console.error("Erro ao buscar sessão inicial:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getInitialSession();

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      if (authAttemptInProgress) {
        return { error: new Error("Processo de autenticação já em andamento") };
      }
      
      setAuthAttemptInProgress(true);
      
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
          description: "Por favor verifique o seu email para confirmar o registo.",
        });
      }
      
      return { error };
    } catch (error) {
      console.error('Erro ao registar:', error);
      return { error: error as Error };
    } finally {
      setAuthAttemptInProgress(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (authAttemptInProgress) {
        return { error: new Error("Processo de autenticação já em andamento") };
      }
      
      setAuthAttemptInProgress(true);
      
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (!error) {
        toast({
          title: "Login bem sucedido",
          description: "Bem-vindo de volta!",
        });
        navigate('/');
      }
      
      return { error };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { error: error as Error };
    } finally {
      setAuthAttemptInProgress(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      toast({
        title: "Sessão terminada",
        description: "A sua sessão foi terminada com sucesso.",
      });
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
      if (authAttemptInProgress) {
        return { error: new Error("Processo já em andamento") };
      }
      
      setAuthAttemptInProgress(true);
      
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
    } finally {
      setAuthAttemptInProgress(false);
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
