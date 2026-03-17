// config.js
// We extract configuring constants in case they need to be replaced by a build step later,
// but for vanilla, we'll assign them directly here.

export const CONFIG = {
    // We are grabbing these from the host environment or hardcoding them for Kiosk mode if allowed.
    // For local dev, you would typically inject these or use a lightweight env parser.
    // For this migration, please replace with actual keys if you don't run this through Vite.
    SUPABASE_URL: 'https://nqkbsvguphojcxcmbnwa.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xa2Jzdmd1cGhvamN4Y21ibndhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjgzODAsImV4cCI6MjA4OTE0NDM4MH0.Kjlgz02fwK8ocvr-2dAEG_UHrkhvkIZv2lbjzhp9UA0'
};
