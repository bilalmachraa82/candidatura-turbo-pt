
import { createClient } from '@supabase/supabase-js';

// Fixed Supabase URLs and keys - using constants for consistency
const supabaseUrl = 'https://sapyhkbmrscensguyzbt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcHloa2JtcnNjZW5zZ3V5emJ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTI2NzAsImV4cCI6MjA2MjcyODY3MH0.fQqkmTLWQGgtpYm85UY97fuRV34_-kA8NGk16rDOilI';

// Create a single Supabase client instance for the entire app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storageKey: 'pt2030-auth-storage',
    detectSessionInUrl: true,
    flowType: 'pkce',
  }
});

// Helper function to check login status
export const isUserLoggedIn = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error checking login status:', error.message);
      return false;
    }
    return !!session;
  } catch (error) {
    console.error('Exception checking login status:', error);
    return false;
  }
};

// Export the types needed for authentication
export type { User, Session } from '@supabase/supabase-js';
