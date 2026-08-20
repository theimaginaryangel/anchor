/**
 * Supabase Client
 *
 * Creates and exports a Supabase client configured for server-side use.
 * Uses the service role key (not the anon key) because all database
 * access happens in API routes, not in the browser.
 *
 * Implemented in Phase 2 (first used when storing documents).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // This will throw at startup if env vars are missing,
  // which is better than a confusing error later.
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
