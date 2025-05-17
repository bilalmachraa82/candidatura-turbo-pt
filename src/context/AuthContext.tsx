import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: AuthError | null }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadSession() {
      setIsLoading(true);
      try {
        console.log('Loading auth session...');
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            console.log('Auth state changed:', event);
            
            if (event === 'SIGNED_IN') {
              toast({
                title: "Autenticação bem-sucedida",
                description: "Bem-vindo de volta!"
              });
            }
            
            if (event === 'SIGNED_OUT') {
              toast({
                title: "Sessão terminada",
                description: "Sessão terminada com sucesso."
              });
            }
            
            setSession(newSession);
            setUser(newSession?.user ?? null);
          }
        );

        // Then check for existing session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error.message);
          throw error;
        }
        
        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        console.log('Initial session state:', 
          data.session ? 'User logged in' : 'No session');

        return () => {
          subscription.unsubscribe();
        };
      } catch (error: any) {
        console.error('Error loading auth session:', error);
        toast({
          variant: "destructive",
          title: "Erro de autenticação",
          description: "Não foi possível carregar a sessão."
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadSession();
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        toast({
          variant: "destructive",
          title: "Erro ao entrar",
          description: error.message || "Verifique as suas credenciais"
        });
        return { success: false, error };
      }

      console.log('Sign in successful');
      
      // Toast is handled by auth state change listener
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error during sign in:', error);
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: "Erro inesperado ao autenticar. Verifique sua conexão com a internet."
      });
      return { success: false, error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao registrar",
          description: error.message
        });
        return { success: false, error };
      }

      toast({
        title: "Registro bem-sucedido",
        description: "Verifique seu email para confirmar o cadastro."
      });
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error during sign up:', error);
      toast({
        variant: "destructive",
        title: "Erro ao registrar",
        description: error.message
      });
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      // Toast is handled by auth state change listener
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: "Ocorreu um erro ao terminar a sessão."
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/atualizar-senha`,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao redefinir senha",
          description: error.message
        });
        return { success: false, error };
      }

      toast({
        title: "Redefinição de senha",
        description: "Verifique seu email para redefinir sua senha."
      });
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error during password reset:', error);
      toast({
        variant: "destructive",
        title: "Erro ao redefinir senha",
        description: error.message
      });
      return { success: false, error };
    }
  };

  const value = {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
