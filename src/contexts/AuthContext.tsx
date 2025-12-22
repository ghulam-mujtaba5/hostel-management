"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { Profile, Space, SpaceMember } from '@/types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  currentSpace: Space | null;
  spaceMembership: SpaceMember | null;
  userSpaces: Space[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ data: any; error: Error | null }>;
  signOut: () => Promise<void>;
  setCurrentSpace: (space: Space) => void;
  refreshProfile: () => Promise<void>;
  refreshSpaces: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentSpace, setCurrentSpaceState] = useState<Space | null>(null);
  const [spaceMembership, setSpaceMembership] = useState<SpaceMember | null>(null);
  const [userSpaces, setUserSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setProfile(data);
    } else if (error) {
      console.log('Profile not found, attempting to create...');
      // If profile doesn't exist, create it from user metadata
      const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
      const { data: newProfile, error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username,
          full_name: username,
        })
        .select()
        .single();
      
      if (newProfile) {
        setProfile(newProfile);
      } else if (upsertError) {
        console.error('Failed to create profile in refreshProfile:', upsertError);
      }
    }
  };

  const refreshSpaces = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('space_members')
      .select(`
        space_id,
        role,
        points,
        spaces:space_id (*)
      `)
      .eq('user_id', user.id);
    
    if (data) {
      const spaces = data
        .map((d: Record<string, unknown>) => d.spaces as Space)
        .filter(Boolean);
      setUserSpaces(spaces);
      
      // Auto-select first space if none selected
      if (!currentSpace && spaces.length > 0) {
        setCurrentSpaceState(spaces[0]);
      }
    }
  };

  const setCurrentSpace = async (space: Space) => {
    setCurrentSpaceState(space);
    localStorage.setItem('currentSpaceId', space.id);
    
    // Fetch membership for this space
    if (user) {
      const { data } = await supabase
        .from('space_members')
        .select('*')
        .eq('space_id', space.id)
        .eq('user_id', user.id)
        .single();
      
      if (data) setSpaceMembership(data);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Clean up URL hash if session is present (from OAuth callbacks)
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash && (hash.includes('access_token') || hash.includes('error') || hash === '#')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);

        // Clean up URL hash after successful sign in from email link or OAuth
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && typeof window !== 'undefined') {
          const hash = window.location.hash;
          if (hash) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
          
          // If on login page and signed in, redirect to home
          if (window.location.pathname === '/login') {
            window.location.href = '/';
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      refreshProfile();
      refreshSpaces();
      
      // Restore last selected space
      const savedSpaceId = localStorage.getItem('currentSpaceId');
      if (savedSpaceId) {
        supabase
          .from('spaces')
          .select('*')
          .eq('id', savedSpaceId)
          .single()
          .then(({ data }) => {
            if (data) setCurrentSpaceState(data);
          });
      }
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    // Development workaround: If email not confirmed error, try OTP
    if (error && error.message.includes('Email not confirmed')) {
      console.warn('Email not confirmed. In production, user should confirm email.');
      // For now, return a more helpful error
      return { error: new Error('Email not confirmed. Please check your email or contact admin to confirm your account.') as any };
    }
    
    return { error };
  };

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { username }
      }
    });
    
    if (error) return { data, error };

    if (data.user) {
      // Wait a bit for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Attempt to create profile (trigger might have already created it)
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          username,
          full_name: username,
        })
        .select();

      if (profileError && !profileError.message?.includes('duplicate')) {
        // Log the error but don't block signup
        console.error('Profile creation/update error:', profileError);
      }
    }
    
    return { data, error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCurrentSpaceState(null);
    setUserSpaces([]);
    localStorage.removeItem('currentSpaceId');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        currentSpace,
        spaceMembership,
        userSpaces,
        loading,
        signIn,
        signUp,
        signOut,
        setCurrentSpace,
        refreshProfile,
        refreshSpaces,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
