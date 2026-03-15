/// <reference types="vite/client" />
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type AppRole = 'admin' | 'cashier';

export interface Profile {
  id: string;
  role: AppRole;
  display_name: string;
}

/** Fetch role from profiles table */
export async function getProfile(session: Session): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, display_name')
    .eq('id', session.user.id)
    .single();
  if (error) return null;
  return data as Profile;
}

/** Display name fallback to email local part */
export function getNameFromSession(session: Session | null): string {
  const email = session?.user?.email ?? '';
  return email.split('@')[0] ?? email;
}
