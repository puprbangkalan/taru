// frontend/src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Ambil variabel lingkungan dari file .env yang akan dibuat di lingkungan hosting
// atau hardcode jika ini hanya untuk tujuan demo dan Anda mengerti risikonya.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
