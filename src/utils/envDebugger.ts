
/**
 * Utility to check required environment variables and warn in development mode
 */
export const checkEnvironmentVariables = () => {
  const requiredVars = [
    'VITE_SUPABASE_URL', 
    'VITE_SUPABASE_ANON_KEY',
    'VITE_FLOWISE_URL',
    'VITE_FLOWISE_API_KEY'
  ];
  
  const missingVars = requiredVars.filter(
    varName => !import.meta.env[varName]
  );
  
  if (missingVars.length > 0) {
    console.warn(
      `⚠️ Missing environment variables: ${missingVars.join(', ')}.\n` +
      `This may cause functionality issues. Make sure to add these to your .env.local file.`
    );
  }
  
  return missingVars.length === 0;
};
