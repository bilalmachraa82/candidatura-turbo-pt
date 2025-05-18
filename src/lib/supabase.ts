
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
let checkingLogin = false;
let cachedLoginState: boolean | null = null;
let cacheTimer: ReturnType<typeof setTimeout> | null = null;

export const isUserLoggedIn = async () => {
  // Se já estamos verificando, retorna o estado em cache ou null
  if (checkingLogin) {
    return cachedLoginState;
  }
  
  // Se temos um valor em cache recente, retorna-o
  if (cachedLoginState !== null && cacheTimer !== null) {
    return cachedLoginState;
  }
  
  try {
    checkingLogin = true;
    const { data: { session } } = await supabase.auth.getSession();
    const loggedIn = !!session;
    
    // Armazena o resultado em cache por 30 segundos
    cachedLoginState = loggedIn;
    if (cacheTimer) clearTimeout(cacheTimer);
    
    cacheTimer = setTimeout(() => {
      cachedLoginState = null;
    }, 30000);
    
    return loggedIn;
  } catch (error) {
    console.error('Erro ao verificar estado de login:', error);
    return false;
  } finally {
    checkingLogin = false;
  }
};

// Limpar o cache de login quando o estado de autenticação muda
supabase.auth.onAuthStateChange(() => {
  if (cacheTimer) clearTimeout(cacheTimer);
  cachedLoginState = null;
});

// Exportar os tipos necessários para autenticação
export type { User, Session } from '@supabase/supabase-js';
