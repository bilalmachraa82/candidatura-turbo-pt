
/**
 * Utility to help debug environment variable configuration issues
 */
export const checkEnvironmentVariables = () => {
  const variables = {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '[SET]' : '[MISSING]',
    FLOWISE_URL: import.meta.env.VITE_FLOWISE_URL,
    FLOWISE_API_KEY: import.meta.env.VITE_FLOWISE_API_KEY ? '[SET]' : '[MISSING]',
    PUBLIC_URL: import.meta.env.VITE_PUBLIC_URL
  };

  console.log('Environment Variables Status:', variables);
  
  return variables;
};
