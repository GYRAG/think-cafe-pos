import { supabase } from './supabase-client.js';

/** Fetch role from profiles table */
export async function getProfile(session) {
    if (!session || !session.user) return null;
    
    const { data, error } = await supabase
        .from('profiles')
        .select('id, role, display_name')
        .eq('id', session.user.id)
        .single();
        
    if (error) return null;
    return data;
}

/** Display name fallback to email local part */
export function getNameFromSession(session) {
    const email = session?.user?.email || '';
    return email.split('@')[0] || email;
}

// Global Auth Manager for Alpine
export function initAuth() {
    return {
        session: undefined,
        user: null, // {id, username, role}
        loading: true,

        async init() {
            // First check existing session
            const { data } = await supabase.auth.getSession();
            await this.handleSession(data.session);

            // Listen for auth changes
            supabase.auth.onAuthStateChange((_event, newSession) => {
                if (this.session?.user?.id !== newSession?.user?.id) {
                    this.session = undefined;
                    this.handleSession(newSession);
                } else {
                    this.session = newSession;
                }
            });
        },

        async handleSession(session) {
            if (session) {
                const profile = await getProfile(session);
                const role = profile?.role || 'cashier';
                const name = profile?.display_name || getNameFromSession(session);
                
                this.user = {
                    id: session.user.id,
                    username: name,
                    role: role
                };
            } else {
                this.user = null;
            }
            this.session = session;
            this.loading = false;

            // Route protection logic
            const isLoginPage = window.location.pathname.includes('login.html');
            const isAdminPage = window.location.pathname.includes('admin.html');
            
            if (!this.user && !isLoginPage && !this.loading) {
                window.location.href = 'login.html';
            } else if (this.user && isLoginPage) {
                window.location.href = 'index.html';
            } else if (this.user && isAdminPage && this.user.role !== 'admin') {
                window.location.href = 'index.html'; // Kick cashiers out of admin
            }
        },

        async logout() {
            await supabase.auth.signOut();
            window.location.href = 'login.html';
        }
    }
}
