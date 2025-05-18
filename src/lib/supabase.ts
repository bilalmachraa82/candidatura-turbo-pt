
import { createClient } from '@supabase/supabase-js';

// Usar as variáveis de ambiente do Vite (não as importações diretas)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sapyhkbmrscensguyzbt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcHloa2JtcnNjZW5zZ3V5emJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTI2NzAsImV4cCI6MjA2MjcyODY3MH0.fQqkmTLWQGgtpYm85UY97fuRV34_-kA8NGk16rDOilI';

// Cliente Supabase usando um storage específico para evitar colisões
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'pt2030-auth-storage-v2', // versão nova para evitar resíduos de sessões antigas
    detectSessionInUrl: false,
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

// Limpar o cache de login quando o estado de autenticação muda
supabase.auth.onAuthStateChange(() => {
  console.log('Auth state changed');
});

// Exportar os tipos necessários para autenticação
export type { User, Session } from '@supabase/supabase-js';
