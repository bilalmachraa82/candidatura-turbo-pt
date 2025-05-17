
import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase URL and key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sapyhkbmrscensguyzbt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcHloa2JtcnNjZW5zZ3V5emJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTI2NzAsImV4cCI6MjA2MjcyODY3MH0.fQqkmTLWQGgtpYm85UY97fuRV34_-kA8NGk16rDOilI';

console.log('Initializing Supabase with URL:', supabaseUrl);

// Create and export the Supabase client with browser-safe configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? localStorage : undefined
  }
});

// Export a helper function to check if a user is logged in
export const isUserLoggedIn = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return !!session && !error;
  } catch (error) {
    console.error('Error checking login status:', error);
    return false;
  }
};
