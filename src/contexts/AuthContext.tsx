"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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
  const [initialized, setInitialized] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    try {
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
    } catch (err) {
      console.error('Error in refreshProfile:', err);
    }
  }, [user]);

  const refreshSpaces = useCallback(async () => {
    if (!user) return;
    
    try {
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
        
        // Auto-select first space if none selected AND not already set
        setCurrentSpaceState(prev => {
          if (!prev && spaces.length > 0) {
            return spaces[0];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error in refreshSpaces:', err);
    }
  }, [user]);

  const setCurrentSpace = async (space: Space) => {
    setCurrentSpaceState(space);
    localStorage.setItem('currentSpaceId', space.id);
    
    // Fetch membership for this space
    if (user) {
      try {
        const { data } = await supabase
          .from('space_members')
          .select('*')
          .eq('space_id', space.id)
          .eq('user_id', user.id)
          .single();
        
        if (data) setSpaceMembership(data);
      } catch (err) {
        console.error('Error fetching space membership:', err);
      }
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setInitialized(true);
        setLoading(false); // Set to false immediately after getting session
      } catch (err) {
        console.error('Error getting session:', err);
        setInitialized(true);
        setLoading(false);
      }

      // Clean up URL hash if session is present (from OAuth callbacks)
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash && (hash.includes('access_token') || hash.includes('error') || hash === '#')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // Always set to false when state changes
      }
    );

    // Listen for service worker cache updates
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSWMessage = (event: MessageEvent) => {
        if (event.data?.type === 'CACHE_UPDATED') {
          console.log('[Auth] Service worker updated - clearing local storage');
          // Clear all storage to force re-login
          localStorage.clear();
          sessionStorage.clear();
          // Reload page to get fresh version
          window.location.reload();
        }
      };

      navigator.serviceWorker.addEventListener('message', handleSWMessage);

      return () => {
        subscription.unsubscribe();
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      };
    }

    return () => subscription.unsubscribe();
  }, []);

  // Load user data when user changes
  useEffect(() => {
    if (user && !initialized) return; // Don't run if just initializing
    
    if (user) {
      refreshProfile();
      refreshSpaces();
      
      // Restore last selected space
      const savedSpaceId = localStorage.getItem('currentSpaceId');
      if (savedSpaceId) {
        (async () => {
          try {
            const { data } = await supabase
              .from('spaces')
              .select('*')
              .eq('id', savedSpaceId)
              .single();
            if (data) setCurrentSpaceState(data);
          } catch (err) {
            console.error('Error restoring space:', err);
          }
        })();
      }
    } else {
      // Clear user data when logged out
      setProfile(null);
      setCurrentSpaceState(null);
      setSpaceMembership(null);
      setUserSpaces([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, initialized]); // refreshProfile and refreshSpaces are stable callbacks

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      // Development workaround: If email not confirmed error, try OTP
      if (error && error.message.includes('Email not confirmed')) {
        console.warn('Email not confirmed. In production, user should confirm email.');
        return { error: new Error('Email not confirmed. Please check your email or contact admin to confirm your account.') as any };
      }
      
      return { error };
    } catch (err) {
      console.error('Sign in error:', err);
      return { error: err as Error };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Clean the username
      const cleanUsername = username.replace(/\s+/g, '_').toLowerCase().trim();
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { 
            username: cleanUsername,
            full_name: username
          }
        }
      });
      
      if (error) return { data, error };

      if (data.user) {
        // Wait a bit for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if profile exists first
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();
        
        // Only create profile if it doesn't exist
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              username: cleanUsername,
              full_name: username,
              email: email,
            }, {
              onConflict: 'id'
            })
            .select();

          if (profileError && !profileError.message?.includes('duplicate')) {
            console.error('Profile creation/update error:', profileError);
          }
        }
      }
      
      return { data, error: null };
    } catch (err) {
      console.error('Sign up error:', err);
      return { data: null, error: err as Error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setCurrentSpaceState(null);
      setSpaceMembership(null);
      setUserSpaces([]);
      localStorage.removeItem('currentSpaceId');
    } catch (err) {
      console.error('Sign out error:', err);
    }
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
