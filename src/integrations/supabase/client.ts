import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { ERROR_MESSAGES } from '@/config/constants';

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_SUPABASE_PUBLISHABLE_KEY environment variable');
}

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-app-version': '1.0.0',
      },
    },
  }
);


supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    localStorage.removeItem('supabase.auth.token');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  }
});