import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { UserRole } from '@/lib/types';

interface UserProfile {
  id: string;
  auth_id: string | null;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isFieldExecutive: boolean;
  isServiceStaff: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile from users table
  const fetchUserProfile = async (authId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data as UserProfile | null;
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Defer profile fetch
        setTimeout(() => {
          fetchUserProfile(session.user.id).then(setUserProfile);
        }, 0);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Defer profile fetch to avoid deadlock
        setTimeout(() => {
          fetchUserProfile(session.user.id).then(setUserProfile);
        }, 0);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole = 'STAFF') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { name, role }
      }
    });

    if (!error && data.user) {
      // Create user profile in users table
      const { error: profileError } = await supabase.from('users').insert({
        auth_id: data.user.id,
        email,
        name,
        role
      });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }

      // If signing up as FIELD_EXECUTIVE, also create a field_executives record
      if (role === 'FIELD_EXECUTIVE') {
        const { error: feError } = await supabase.from('field_executives').insert({
          name,
          phone: null,
          base_location: null,
          skills: null,
          active: true
        });

        if (feError) {
          console.error('Error creating field executive record:', feError);
        }
      }
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  // Role helpers
  const isFieldExecutive = userProfile?.role === 'FIELD_EXECUTIVE';
  const isServiceStaff = userProfile?.role === 'STAFF';
  const isAdmin = userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      userProfile,
      loading, 
      signIn, 
      signUp, 
      signOut,
      isFieldExecutive,
      isServiceStaff,
      isAdmin
    }}>
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

// Type-safe hook to access user role
export function useUserRole() {
  const { userProfile } = useAuth();
  return userProfile?.role ?? null;
}
