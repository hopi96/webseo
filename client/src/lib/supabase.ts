import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const missingCredentials = !supabaseUrl || !supabaseAnonKey;

if (missingCredentials) {
    console.warn(
        'Supabase URL or Anon Key is missing. ' +
        'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment secrets. ' +
        'Authentication and data features will not work until these are configured.'
    );
}

export const supabase: SupabaseClient = missingCredentials
    ? createClient('https://placeholder.supabase.co', 'placeholder-key-that-is-long-enough-for-validation-purposes-only')
    : createClient(supabaseUrl, supabaseAnonKey);
