
/**
 * Debug helper to check if all required environment variables are set
 */
export function checkEnvironmentVariables() {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_FLOWISE_URL',
    'VITE_FLOWISE_API_KEY',
  ];

  const missingVars = requiredVars.filter(
    varName => !import.meta.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      `⚠️ Missing environment variables: ${missingVars.join(', ')}\n` +
      'Make sure to set these in your .env file!'
    );
  } else {
    console.log('✅ All required environment variables are set!');
  }

  // Also check for Railway specific variables in production
  if (import.meta.env.PROD && !import.meta.env.VITE_PUBLIC_URL) {
    console.warn('⚠️ Missing VITE_PUBLIC_URL in production environment');
  }
}
