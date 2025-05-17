
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';
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
    let mounted = true;
    
    async function setupAuth() {
      try {
        setIsLoading(true);
        console.log('Inicializando autenticação...');
        
        // Set up the auth state change listener first
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (!mounted) return;
          
          console.log('Estado de autenticação alterado:', event);
          
          // Update session and user state synchronously
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          // Show toasts for login/logout events
          if (event === 'SIGNED_IN') {
            console.log('Usuário autenticado com sucesso:', newSession?.user?.email);
            toast({
              title: "Login bem-sucedido",
              description: `Bem-vindo, ${newSession?.user?.email}`
            });
          } else if (event === 'SIGNED_OUT') {
            console.log('Usuário desconectado');
            toast({
              title: "Sessão terminada",
              description: "Você foi desconectado com sucesso."
            });
          }
        });
        
        // Then check for an existing session
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Erro ao buscar sessão:', error.message);
          throw error;
        }
        
        console.log('Sessão existente:', data.session ? 'Sim' : 'Não');
        
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
        }
      } catch (error: any) {
        console.error('Erro na inicialização da autenticação:', error);
        if (mounted) {
          toast({
            variant: "destructive",
            title: "Erro de autenticação",
            description: "Não foi possível inicializar a autenticação."
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
      
      return () => {
        mounted = false;
      };
    }
    
    setupAuth();
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentando login com email:', email);
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro de autenticação Supabase:', error);
        toast({
          variant: "destructive",
          title: "Erro ao entrar",
          description: error.message || "Verifique as suas credenciais"
        });
        return { success: false, error };
      }

      console.log('Login bem-sucedido para:', data.user?.email);
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Erro durante o login:', error);
      toast({
        variant: "destructive",
        title: "Erro ao entrar",
        description: "Erro inesperado ao autenticar. Verifique sua conexão com a internet."
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
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
