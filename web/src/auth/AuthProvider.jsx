import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseConfigurationError } from '../lib/supabaseClient';
import { arabicError } from '../lib/serviceErrors';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ session: null, loading: !!supabase, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!supabase) return;
    let live = true;
    let receivedEvent = false;
    // Synchronous callback: do not await Supabase calls inside an auth event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedEvent = true;
      if (live) setState({ session, loading: false, error: '' });
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (live && !receivedEvent) setState({ session: data?.session ?? null, loading: false, error: error ? arabicError(error, 'auth') : '' });
    }).catch(error => {
      if (live && !receivedEvent) setState({ session: null, loading: false, error: arabicError(error, 'auth') });
    });
    return () => { live = false; subscription.unsubscribe(); };
  }, [attempt]);

  const value = {
    ...state,
    configured: !supabaseConfigurationError,
    retry() { setState(current => ({ ...current, loading: true, error: '' })); setAttempt(current => current + 1); },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    },
    async signUp(email, password) {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password,
        options: { emailRedirectTo: `${window.location.origin}${window.location.pathname}` } });
      if (error) throw error;
      return data;
    },
    async signOut() {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
