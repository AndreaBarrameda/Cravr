import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dzzdrppnmdqfeffhjmlx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iCN2kCxcEScsqWo_wQvYpA_x7glPnOt';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const auth = {
  async signUp(email: string, password: string, name: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name
          }
        }
      });
      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      return { user: null, session: null, error };
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  async getCurrentSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session: data.session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  },

  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
};

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
};

export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  // eslint-disable-next-line no-console
  console.log('Setting up auth state listener');

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    // eslint-disable-next-line no-console
    console.log('Auth state changed:', event, session?.user?.email);

    if (session?.user) {
      callback({
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.display_name
      });
    } else {
      callback(null);
    }
  });

  return () => {
    // eslint-disable-next-line no-console
    console.log('Unsubscribing from auth state listener');
    data?.subscription?.unsubscribe();
  };
}
