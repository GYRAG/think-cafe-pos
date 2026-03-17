import { CONFIG } from './config.js';

// Initialize the Supabase client using the UMD build loaded via CDN
// window.supabase is available from the script tag in index.html

export const supabase = window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY
);
