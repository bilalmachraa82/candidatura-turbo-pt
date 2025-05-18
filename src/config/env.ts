
interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  flowiseUrl: string;
  flowiseApiKey: string;
}

const getEnvConfig = (): EnvConfig => {
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    flowiseUrl: import.meta.env.VITE_FLOWISE_URL || '',
    flowiseApiKey: import.meta.env.VITE_FLOWISE_API_KEY || ''
  };
};

const validateEnv = (): void => {
  const config = getEnvConfig();
  
  const missingVars: string[] = [];
  
  if (!config.supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!config.supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');
  if (!config.flowiseUrl) missingVars.push('VITE_FLOWISE_URL');
  if (!config.flowiseApiKey) missingVars.push('VITE_FLOWISE_API_KEY');
  
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
