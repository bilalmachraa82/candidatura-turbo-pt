
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação mais detalhada das variáveis de ambiente
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`
    ⚠️ Configuração do Supabase incompleta ⚠️
    
    Por favor, configure as variáveis de ambiente:
    
    VITE_SUPABASE_URL = ${supabaseUrl ? '✓' : '✗'} ${!supabaseUrl ? '(em falta)' : ''}
    VITE_SUPABASE_ANON_KEY = ${supabaseAnonKey ? '✓' : '✗'} ${!supabaseAnonKey ? '(em falta)' : ''}
    
    Consulte o arquivo .env.local.example para mais detalhes.
  `);
}

// Validação da URL
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Verificar se a URL é válida
if (supabaseUrl && !isValidUrl(supabaseUrl)) {
  console.error(`
    ⚠️ URL do Supabase inválida: "${supabaseUrl}" ⚠️
    
    O formato correto deve ser algo como:
    https://your-project-id.supabase.co
  `);
}

// Criar o cliente Supabase apenas se as verificações passarem
let supabase;

if (supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.info('✅ Cliente Supabase inicializado com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao inicializar o cliente Supabase:', error);
    supabase = createMockSupabaseClient();
  }
} else {
  console.warn('⚠️ Utilizando cliente Supabase simulado devido a configuração incompleta.');
  supabase = createMockSupabaseClient();
}

// Função para criar um cliente simulado quando a configuração está incorreta
function createMockSupabaseClient() {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Supabase não configurado') }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ error: new Error('Supabase não configurado') }),
      signInWithPassword: () => Promise.resolve({ error: new Error('Supabase não configurado') }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: new Error('Supabase não configurado') })
    },
    from: () => ({
      select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: new Error('Supabase não configurado') }) }) }),
      insert: () => Promise.resolve({ error: new Error('Supabase não configurado') }),
      delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase não configurado') }) }),
      count: () => Promise.resolve({ data: 0, error: new Error('Supabase não configurado') })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: new Error('Supabase não configurado') })
      })
    }
  };
}

export { supabase };
