
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export const fetchUserProfile = async (userId: string) => {
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

export const signInWithEmail = async (email: string, password: string) => {
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

export const signUpWithEmail = async (email: string, password: string, userData: {
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

export const signOutUser = async () => {
  try {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    toast({
      title: "Error",
      description: "Failed to sign out. Please try again.",
      variant: "destructive"
    });
    return { success: false };
  }
};
