import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { getProfile as fetchProfileApi } from '../api/profileApi.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState(null);

  const token = session?.access_token;

  useEffect(() => {
    const init = async () => {
      const {
        data: { session: persistedSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        setError(sessionError.message);
      }

      setSession(persistedSession);
      setUser(persistedSession?.user ?? null);
      setAuthLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    init();
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = useCallback(async () => {
    if (!token) {
      setProfile(null);
      return;
    }
    setProfileLoading(true);
    try {
      const { profile: profileData } = await fetchProfileApi(token);
      setProfile(profileData);
      setError(null);
    } catch (err) {
      console.error('Failed to load profile', err);
      setError(err.message);
    } finally {
      setProfileLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      throw authError;
    }
    setSession(data.session);
    setUser(data.session?.user ?? null);
    await loadProfile();
    return data;
  }, [loadProfile]);

  const signUp = useCallback(async ({ email, password, username }) => {
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || null,
        },
      },
    });
    if (authError) {
      throw authError;
    }
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const signInWithProvider = useCallback(async (provider) => {
    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });
    if (authError) {
      throw authError;
    }
    return data;
  }, []);

  const plan = profile?.plan || 'free';
  const planExpiresAt = profile?.plan_expires_at || null;
  const planTier = ['free', 'plus', 'pro'].includes(plan) ? plan : 'free';
  const planRank = { free: 0, plus: 1, pro: 2 }[planTier];
  const isPro = planTier === 'pro' && (!planExpiresAt || new Date(planExpiresAt).getTime() > Date.now());
  const isPlus = planTier === 'plus' && (!planExpiresAt || new Date(planExpiresAt).getTime() > Date.now());

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      authLoading,
      profileLoading,
      error,
      token,
      plan,
      planExpiresAt,
      planTier,
      planRank,
      isPro,
      isPlus,
      signIn,
      signUp,
      signOut,
      signInWithProvider,
      refreshProfile: loadProfile,
    }),
    [
      session,
      user,
      profile,
      authLoading,
      profileLoading,
      error,
      token,
      plan,
      planExpiresAt,
      planTier,
      planRank,
      isPro,
      isPlus,
      signIn,
      signUp,
      signOut,
      signInWithProvider,
      loadProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
};
