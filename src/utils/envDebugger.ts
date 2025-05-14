
// Utility to check environment variables in dev mode
export function checkEnvironmentVariables() {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_FLOWISE_URL',
    'VITE_FLOWISE_API_KEY',
  ];
  
  const missingVars = requiredVars.filter(key => !import.meta.env[key]);
  
  console.log('Environment variables check:');
  console.log(`VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? '✓' : '✗'}`);
  console.log(`VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗'}`);
  
  if (missingVars.length > 0) {
    console.warn(
      `⚠️ Missing environment variables: ${missingVars.join(', ')}. 
      Make sure to set these in .env.local or through your deployment platform.`
    );
  } else {
    console.log('✅ All required environment variables are set.');
  }

  return {
    supabaseConfigured: Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
    flowiseConfigured: Boolean(import.meta.env.VITE_FLOWISE_URL && import.meta.env.VITE_FLOWISE_API_KEY)
  };
}
