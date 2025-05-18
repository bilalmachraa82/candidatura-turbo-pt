
import { createClient } from '@supabase/supabase-js';

// Usar variáveis de ambiente corretamente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sapyhkbmrscensguyzbt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcHloa2JtcnNjZW5zZ3V5emJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTI2NzAsImV4cCI6MjA2MjcyODY3MH0.fQqkmTLWQGgtpYm85UY97fuRV34_-kA8NGk16rDOilI';

// Cliente Supabase usando configuração explícita para autenticação
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'pt2030-auth-storage-v2', 
    detectSessionInUrl: false,
    flowType: 'pkce',
  }
});

// Função auxiliar para verificar o estado de login sem disparar múltiplos pedidos
export const isUserLoggedIn = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    console.error('Erro ao verificar estado de login:', error);
    return false;
  }
};

// Exportar os tipos necessários para autenticação
export type { User, Session } from '@supabase/supabase-js';
