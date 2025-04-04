
import React, { createContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { AuthContextProps } from '@/types/auth';
import { fetchUserProfile, signInWithEmail, signUpWithEmail, signOutUser } from '@/utils/auth';

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          // Use setTimeout to avoid potential deadlocks with Supabase auth
          setTimeout(async () => {
            const userId = currentSession?.user?.id;
            if (userId) {
              const profile = await fetchUserProfile(userId);
              setUserProfile(profile);
            }
            navigate('/dashboard');
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          // Use setTimeout to avoid potential deadlocks with Supabase auth
          setTimeout(() => {
            setUserProfile(null);
            navigate('/');
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        const profile = await fetchUserProfile(currentSession.user.id);
        setUserProfile(profile);
      }
      
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmail(email, password);
    
    if (result.data?.user) {
      const profile = await fetchUserProfile(result.data.user.id);
      setUserProfile(profile);
    }
    
    return result;
  };

  const signUp = async (email: string, password: string, userData: {
    full_name?: string;
    phone_number?: string;
    preferred_language?: string;
  }) => {
    return signUpWithEmail(email, password, userData);
  };

  const signOut = async () => {
    const { success } = await signOutUser();
    if (success) {
      setUserProfile(null);
    }
  };

  const value = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    loading,
    userProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export from the hook file
export { useAuth } from '@/hooks/useAuthContext';
