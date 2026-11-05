import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceKey);

if (!isSupabaseConfigured) {
  console.warn(
    '[DRAYEN Backend] Supabase credentials not found in environment. Server will use local SQLite as fallback.'
  );
}

// Server Supabase Admin Client with elevated privileges
export const supabaseServer = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

