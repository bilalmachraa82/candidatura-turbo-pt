
import { createClient } from '@supabase/supabase-js';

// URLs e chaves fixas do Supabase para evitar problemas de variáveis de ambiente
const supabaseUrl = 'https://sapyhkbmrscensguyzbt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcHloa2JtcnNjZW5zZ3V5emJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTI2NzAsImV4cCI6MjA2MjcyODY3MH0.fQqkmTLWQGgtpYm85UY97fuRV34_-kA8NGk16rDOilI';

console.log('Inicializando Supabase com URL:', supabaseUrl);

// Criação do cliente Supabase com configurações de autenticação explícitas
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Changed to false to avoid redirection issues
    storage: typeof window !== 'undefined' ? localStorage : undefined
  }
});

// Função auxiliar para verificar o status do login
export const isUserLoggedIn = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Erro verificando status do login:', error.message);
      return false;
    }
    return !!session;
  } catch (error) {
    console.error('Exceção verificando status do login:', error);
    return false;
  }
};
