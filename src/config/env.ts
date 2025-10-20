
interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  openRouterApiKey: string;
}

const getEnvConfig = (): EnvConfig => {
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    openRouterApiKey: import.meta.env.VITE_OPENROUTER_API_KEY || ''
  };
};

const validateEnv = (): void => {
  const config = getEnvConfig();

  const missingVars: string[] = [];

  if (!config.supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!config.supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');
  if (!config.openRouterApiKey) missingVars.push('VITE_OPENROUTER_API_KEY');

  if (missingVars.length > 0) {
    console.warn(
      `⚠️ Missing environment variables: ${missingVars.join(', ')}.\n` +
      'Some features may not work correctly.\n' +
      'Please check your .env or .env.local file.'
    );
  }
};

// Run validation on import
validateEnv();

export default getEnvConfig;
