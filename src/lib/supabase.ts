import { createClient } from '@supabase/supabase-js';

// Use the correct Supabase URL and anon key from your project
const supabaseUrl = 'https://sapyhkbmrscensguyzbt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcHloa2JtcnNjZW5zZ3V5emJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTI2NzAsImV4cCI6MjA2MjcyODY3MH0.fQqkmTLWQGgtpYm85UY97fuRV34_-kA8NGk16rDOilI';

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
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'pt2030-auth-token',
        // Develoment mode: don't require email confirmation
        flowType: 'pkce',
        detectSessionInUrl: true,
        debug: import.meta.env.DEV,
      }
    });
    console.info('✅ Cliente Supabase inicializado com sucesso.');
  } catch (error) {
    console.error('❌ Erro ao inicializar o cliente Supabase:', error);
    supabase = createMockSupabaseClient();
  }
} else {
  console.warn('⚠️ Utilizando cliente Supabase simulado devido a configuração incompleta.');
  supabase = createMockSupabaseClient();
}

// Função para criar um cliente simulado quando a configuração está incorreta ou o serviço está indisponível
function createMockSupabaseClient() {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Supabase não configurado ou temporariamente indisponível') }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signUp: () => Promise.resolve({ error: new Error('Supabase não configurado ou temporariamente indisponível') }),
      signInWithPassword: () => Promise.resolve({ error: new Error('Supabase não configurado ou temporariamente indisponível') }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ error: new Error('Supabase não configurado ou temporariamente indisponível') })
    },
    from: () => ({
      select: () => ({ 
        eq: () => ({ 
          order: () => Promise.resolve({ data: [], error: new Error('Supabase não configurado ou temporariamente indisponível') }) 
        }),
        count: () => ({ 
          eq: () => ({ 
            order: () => Promise.resolve({ data: [], error: new Error('Supabase não configurado ou temporariamente indisponível') }) 
          })
        })
      }),
      insert: () => Promise.resolve({ error: new Error('Supabase não configurado ou temporariamente indisponível') }),
      delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase não configurado ou temporariamente indisponível') }) }),
      count: () => Promise.resolve({ data: 0, error: new Error('Supabase não configurado ou temporariamente indisponível') })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ error: new Error('Supabase não configurado ou temporariamente indisponível') })
      })
    }
  };
}

export { supabase };
