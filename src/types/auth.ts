
import { User, Session } from '@supabase/supabase-js';

export interface UserData {
  full_name?: string;
  phone_number?: string;
  preferred_language?: string;
}

export interface AuthContextProps {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any | null; data: any | null }>;
  signUp: (email: string, password: string, userData: UserData) => Promise<{ error: any | null; data: any | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
  userProfile: any | null;
}
