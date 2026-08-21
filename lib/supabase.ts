/**
 * Supabase Client
 *
 * Creates and exports a Supabase client configured for server-side use.
 * Uses the service role key (not the anon key) because all database
 * access happens in API routes, not in the browser.
 *
 * Lazy-initialized to avoid crashing during `next build` when
 * environment variables are not yet available.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error(
          'Missing Supabase environment variables. ' +
          'Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
        );
      }
      _supabase = createClient(url, key);
    }
    return (_supabase as any)[prop];
  }
});
