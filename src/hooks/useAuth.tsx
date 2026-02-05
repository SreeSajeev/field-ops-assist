/*import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { UserRole } from '@/lib/types';
import { SignUpSchema, formatZodError } from '@/lib/validation';
import { z } from 'zod';

interface UserProfile {
  id: string;
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
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<{ error: Error | null }>;
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

  
  const resolveUserProfile = async (authUser: User) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, active')
      .eq('auth_id', authUser.id)
      .single();

    if (error) {
      console.error('Failed to resolve user profile:', error);
      return null;
    }

    return data as UserProfile;
  };

  
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profile = await resolveUserProfile(session.user);
        setUserProfile(profile);
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profile = await resolveUserProfile(session.user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

 
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error as Error | null };
  };

  
  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<{ error: Error | null }> => {
    try {
      SignUpSchema.parse({ email, password, name, role });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) return { error };
      if (!data.user) return { error: new Error('Auth user not created') };

      const { error: insertError } = await supabase.from('users').insert({
        auth_id: data.user.id,
        email: email.trim(),
        name: name.trim(),
        role,
        active: true,
      });

      if (insertError) return { error: insertError };

      return { error: null };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { error: new Error(formatZodError(err)) };
      }
      return { error: err as Error };
    }
  };

  
  const signOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  const isFieldExecutive = userProfile?.role === 'FIELD_EXECUTIVE';
  const isServiceStaff = userProfile?.role === 'STAFF';
  const isAdmin =
    userProfile?.role === 'ADMIN' || userProfile?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        isFieldExecutive,
        isServiceStaff,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useUserRole() {
  const { userProfile } = useAuth();
  return userProfile?.role ?? null;
}
*/

/*
import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { UserRole } from "@/lib/types";
import { SignUpSchema, formatZodError } from "@/lib/validation";
import { z } from "zod";

interface UserProfile {
  id: string;
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
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<{ error: Error | null }>;
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

  const resolveUserProfile = async (authUser: User) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, active")
      .eq("auth_id", authUser.id)
      .single();

    if (error) {
      console.error("Failed to resolve user profile:", error);
      return null;
    }

    return data as UserProfile;
  };

  /// ================= AUTH BOOTSTRAP ================= 
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;

        const session = data.session ?? null;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const profile = await resolveUserProfile(session.user);
          if (!cancelled) setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);

      if (session?.user) {
        const profile = await resolveUserProfile(session.user);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  ///================= ACTIONS ================= 

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<{ error: Error | null }> => {
    try {
      SignUpSchema.parse({ email, password, name, role });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) return { error };
      if (!data.user) return { error: new Error("Auth user not created") };

      const { error: insertError } = await supabase.from("users").insert({
        auth_id: data.user.id,
        email: email.trim(),
        name: name.trim(),
        role,
        active: true,
      });

      if (insertError) return { error: insertError };

      return { error: null };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { error: new Error(formatZodError(err)) };
      }
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();

    // 🔑 HARD RESET (fixes stuck loading)
    setUser(null);
    setSession(null);
    setUserProfile(null);
    setLoading(false);
  };

  const isFieldExecutive = userProfile?.role === "FIELD_EXECUTIVE";
  const isServiceStaff = userProfile?.role === "STAFF";
  const isAdmin =
    userProfile?.role === "ADMIN" || userProfile?.role === "SUPER_ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        isFieldExecutive,
        isServiceStaff,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useUserRole() {
  const { userProfile } = useAuth();
  return userProfile?.role ?? null;
}
*/

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { UserRole } from "@/lib/types";
import { SignUpSchema, formatZodError } from "@/lib/validation";
import { z } from "zod";

/* ================= TYPES ================= */

interface UserProfile {
  id: string;
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
  signUp: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isFieldExecutive: boolean;
  isServiceStaff: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ================= HELPERS ================= */

const parseUserRole = (role: string): UserRole | null => {
  if (
    role === "STAFF" ||
    role === "FIELD_EXECUTIVE" ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  ) {
    return role;
  }
  return null;
};

/* ================= PROVIDER ================= */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isMounted = useRef(true);

  /* ---------- PROFILE RESOLUTION ---------- */

  const resolveUserProfile = async (
    authUser: User
  ): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, active")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (error || !data) {
      console.error("User profile missing:", error);
      return null;
    }

    const parsedRole = parseUserRole(data.role);
    if (!parsedRole) {
      console.error("Invalid role in DB:", data.role);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: parsedRole,
      active: data.active,
    };
  };

  /* ---------- INITIAL BOOTSTRAP ---------- */

  useEffect(() => {
    isMounted.current = true;

    const bootstrap = async () => {
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const activeSession = data.session ?? null;

      if (!isMounted.current) return;

      setSession(activeSession);
      setUser(activeSession?.user ?? null);

      if (activeSession?.user) {
        const profile = await resolveUserProfile(activeSession.user);
        if (isMounted.current) setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      if (isMounted.current) setLoading(false);
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted.current) return;

      setLoading(true);
      setSession(newSession ?? null);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        const profile = await resolveUserProfile(newSession.user);
        if (isMounted.current) setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      if (isMounted.current) setLoading(false);
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  /* ---------- ACTIONS ---------- */

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    return { error: error as Error | null };
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<{ error: Error | null }> => {
    try {
      SignUpSchema.parse({ email, password, name, role });

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name, role },
        },
      });

      if (error) return { error };
      return { error: null };
    } catch (err) {
      if (err instanceof z.ZodError) {
        return { error: new Error(formatZodError(err)) };
      }
      return { error: err as Error };
    }
  };

  /**
   * 🔥 HARD LOGOUT (production safe)
   */
  const signOut = async () => {
    await supabase.auth.signOut();

    // Clear local state
    setUser(null);
    setSession(null);
    setUserProfile(null);

    // Force full reset (prevents guard loops)
    window.location.href = "/";
  };

  /* ---------- DERIVED ROLES ---------- */

  const isFieldExecutive = userProfile?.role === "FIELD_EXECUTIVE";
  const isServiceStaff = userProfile?.role === "STAFF";
  const isAdmin =
    userProfile?.role === "ADMIN" || userProfile?.role === "SUPER_ADMIN";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        signIn,
        signUp,
        signOut,
        isFieldExecutive,
        isServiceStaff,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
