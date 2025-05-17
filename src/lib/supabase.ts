
import { createClient } from '@supabase/supabase-js';

// Use environment variables for Supabase URL and key
const supabaseUrl = 'https://sapyhkbmrscensguyzbt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcHloa2JtcnNjZW5zZ3V5emJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTI2NzAsImV4cCI6MjA2MjcyODY3MH0.fQqkmTLWQGgtpYm85UY97fuRV34_-kA8NGk16rDOilI';

// Create and export the Supabase client with browser-safe configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // Use window.localStorage only on client side
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'pt2030-auth-token',
    detectSessionInUrl: false,
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
