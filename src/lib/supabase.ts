// ============================================================================
// LafiaPay — Supabase Client Configuration
// Initializes the Supabase client with environment variables.
// Falls back to mock mode if credentials are not provided.
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/** Whether we're running in mock mode (no Supabase credentials) */
export const IS_MOCK_MODE = !supabaseUrl || !supabaseAnonKey || 
  supabaseUrl === 'your-supabase-project-url';

/** Supabase client instance — may be a dummy if in mock mode */
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Log mode for developer awareness
if (IS_MOCK_MODE) {
  console.info(
    '%c🔧 LafiaPay — Mode Démo (données locales)',
    'color: #D4A017; font-size: 14px; font-weight: bold;'
  );
  console.info(
    'Pour connecter Supabase, configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env'
  );
}
