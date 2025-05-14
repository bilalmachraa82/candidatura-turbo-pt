
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

// Configurar o controle de estado de serviço indisponível
let serviceDownSince: Date | null = null;
let consecutiveFailures = 0;
const maxFailuresBeforeBackoff = 3;
let currentBackoffTime = 5000; // 5 segundos iniciais
const maxBackoffTime = 60000; // 1 minuto máximo

// Criar o cliente Supabase apenas se as verificações passarem
let supabase;

if (supabaseUrl && supabaseAnonKey && isValidUrl(supabaseUrl)) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: 'pt2030-auth-token',
      },
      global: {
        fetch: (...args) => {
          // Custom fetch handler with better timeout and retry logic
          const fetchWithTimeout = (url: string, options: RequestInit = {}, timeoutMs = 8000) => {
            // Se o serviço estiver indisponível há mais de 5 minutos, reduzir as tentativas
            if (serviceDownSince && (new Date().getTime() - serviceDownSince.getTime() > 300000)) {
              // Adicionar controle de taxa (rate limiting) quando o serviço está em baixa
              if (Math.random() > 0.2) { // Apenas 20% das solicitações passam
                return Promise.reject(new Error('Supabase service is down, limiting requests'));
              }
            }

            return Promise.race([
              fetch(url, { ...options })
                .then(response => {
                  if (response.status === 503) {
                    // Serviço indisponível
                    if (!serviceDownSince) {
                      serviceDownSince = new Date();
                    }
                    consecutiveFailures++;
                    
                    if (consecutiveFailures >= maxFailuresBeforeBackoff) {
                      // Aumentar o tempo de espera entre solicitações
                      currentBackoffTime = Math.min(currentBackoffTime * 1.5, maxBackoffTime);
                    }
                    
                    throw new Error('Service Unavailable');
                  } else {
                    // Resetar contadores se o serviço voltar
                    serviceDownSince = null;
                    consecutiveFailures = 0;
                    currentBackoffTime = 5000;
                    return response;
                  }
                }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Supabase request timeout')), timeoutMs)
              )
            ]) as Promise<Response>;
          };
          
          // @ts-ignore - Type mismatch is acceptable here
          return fetchWithTimeout(args[0], args[1]);
        }
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
