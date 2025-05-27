
// Re-export the Supabase client from the integration
export { supabase, isUserLoggedIn } from '@/integrations/supabase/client';
export type { User, Session } from '@supabase/supabase-js';
