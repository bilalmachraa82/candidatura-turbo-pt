
import { createClient } from '@supabase/supabase-js';

// Supabase URLs e chaves
const supabaseUrl = 'https://sapyhkbmrscensguyzbt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcHloa2JtcnNjZW5zZ3V5emJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTI2NzAsImV4cCI6MjA2MjcyODY3MH0.fQqkmTLWQGgtpYm85UY97fuRV34_-kA8NGk16rDOilI';

// Cria uma única instância do cliente Supabase para toda a aplicação
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'pt2030-auth-storage',
    detectSessionInUrl: false,
  }
});

// Função auxiliar para verificar o estado de login
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
