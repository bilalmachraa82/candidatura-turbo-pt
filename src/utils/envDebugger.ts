
// Utility to check environment variables in dev mode
export function checkEnvironmentVariables() {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_FLOWISE_URL',
    'VITE_FLOWISE_API_KEY',
  ];
  
  const missing = requiredVars.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.warn(
      `⚠️ Missing environment variables: ${missing.join(', ')}. 
      Make sure to set these in .env.local or through your deployment platform.`
    );
  } else {
    console.log('✅ All required environment variables are set.');
  }
}
