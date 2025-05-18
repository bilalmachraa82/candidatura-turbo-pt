
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

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
  const navigate = useNavigate();
  const location = useLocation();
  
  // Verificar a sessão atual e configurar o listener de mudanças de estado de autenticação
  useEffect(() => {
    // Flag para garantir que só limpamos a função uma vez
    let mounted = true;
    
    const setupAuthListener = async () => {
      try {
        // Configurar o listener de autenticação ANTES de verificar a sessão atual
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (!mounted) return;
          
          console.log(`Auth state changed: ${event}`, newSession?.user?.email || 'no user');
          
          if (newSession) {
            setSession(newSession);
            setUser(newSession.user);
            
            // Não mostrar toast durante inicialização
            if (!isLoading && event === 'SIGNED_IN') {
              toast({
                title: "Login bem-sucedido",
                description: `Bem-vindo, ${newSession.user.email}`
              });
              
              // Redirecionar para a página principal após login
              if (location.pathname === '/login' || location.pathname === '/register') {
                navigate('/');
              }
            }
          } else {
            setSession(null);
            setUser(null);
            
            // Não mostrar toast durante inicialização
            if (!isLoading && event === 'SIGNED_OUT') {
              toast({
                title: "Sessão terminada",
                description: "Você foi desconectado com sucesso."
              });
            }
          }
        });

        // APÓS configurar o listener, verificar se há uma sessão atual
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error);
          throw error;
        }
        
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setIsLoading(false);
          
          // Se estamos em uma rota de autenticação mas já estamos logados, redirecionar
          if (data.session && (location.pathname === '/login' || location.pathname === '/register')) {
            navigate('/');
          }
        }
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    
    setupAuthListener();
    
    // Limpar ao desmontar componente
    return () => {
      mounted = false;
    };
  }, [toast, navigate, location.pathname, isLoading]);
  
  // Implementar funções de autenticação com melhor tratamento de erros
  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentando login com Supabase para:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Erro de autenticação durante o login:', error);
        return { success: false, error };
      }
      
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Exceção durante o login:', error);
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
      console.error('Erro durante o registro:', error);
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
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
        redirectTo: `${window.location.origin}/reset-password`,
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
      console.error('Erro durante a redefinição de senha:', error);
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
    console.warn('useAuth foi chamado fora do AuthProvider - retornando valores padrão');
    return {
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      signIn: async () => ({ success: false, error: null }),
      signUp: async () => ({ success: false, error: null }),
      signOut: async () => {},
      resetPassword: async () => ({ success: false, error: null }),
    };
  }
  return context;
}
