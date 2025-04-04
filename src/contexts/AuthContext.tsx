
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any | null; data: any | null }>;
  signUp: (email: string, password: string, userData: {
    full_name?: string;
    phone_number?: string;
    preferred_language?: string;
  }) => Promise<{ error: any | null; data: any | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
  userProfile: any | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

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
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (data.user) {
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.user_metadata?.full_name || data.user.email}!`,
        });
        
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
      }
      
      return { data, error };
    } catch (error) {
      console.error('Error signing in:', error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return { error, data: null };
    }
  };

  const signUp = async (email: string, password: string, userData: {
    full_name?: string;
    phone_number?: string;
    preferred_language?: string;
  }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Registration successful",
          description: "Your account has been created successfully!",
        });
      }
      
      return { data, error };
    } catch (error) {
      console.error('Error signing up:', error);
      toast({
        title: "Registration failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return { error, data: null };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUserProfile(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
