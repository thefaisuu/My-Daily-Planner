import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client = null;
if (supabaseUrl && supabaseAnonKey) {
  try {
    if (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) {
      client = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      console.warn('Supabase URL must start with http:// or https://. Falling back to local storage.');
    }
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
}

export const supabase = client;
