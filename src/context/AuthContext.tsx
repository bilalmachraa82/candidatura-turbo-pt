
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

// Flag para controlar se já configuramos a subscrição de auth
let hasSetupAuthListener = false;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    // Flag para garantir que só limpamos a função uma vez
    let mounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;
    
    const initializeAuth = async () => {
      try {
        // Se já configuramos a subscrição antes, não configurar novamente
        if (!hasSetupAuthListener) {
          hasSetupAuthListener = true;
          
          // Configurar a subscrição de alteração de estado de autenticação apenas uma vez
          const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
            if (!mounted) return;
            
            console.log(`Auth state changed: ${event}`, newSession?.user?.email || 'no user');
            
            setSession(newSession);
            setUser(newSession?.user ?? null);
            
            if (isLoading) {
              setIsLoading(false);
            } else {
              if (event === 'SIGNED_IN') {
                toast({
                  title: "Login bem-sucedido",
                  description: `Bem-vindo, ${newSession?.user?.email}`
                });
              } else if (event === 'SIGNED_OUT') {
                toast({
                  title: "Sessão terminada",
                  description: "Você foi desconectado com sucesso."
                });
              }
            }
          });
          
          authSubscription = data.subscription;
        }
        
        // Verificar a sessão existente apenas uma vez durante a inicialização
        const { data } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    // Limpar ao desmontar componente
    return () => {
      mounted = false;
      // Não desinscrever a subscrição global de auth - isso causaria problemas
      // Se precisar desinscrever, faça isso apenas quando a aplicação fechar completamente
    };
  }, [toast]);
  
  // Implementar funções de autenticação com melhor tratamento de erros
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Auth error during sign in:', error);
        return { success: false, error };
      }
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Exception during sign in:', error);
      return { 
        success: false, 
        error: error as AuthError 
      };
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
      // Toast é tratado pelo listener de alteração de estado de auth
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
