import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData: any) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const createSimpleProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      // Check students table
      const { data: student } = await supabase
        .from("students")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(); // ✅ safe

      if (student) {
        console.log("🧑‍🎓 Student logged in");
        return { id: user.id, email: user.email || "", role: "student" };
      }

      // Check faculty table
      const { data: faculty } = await supabase
        .from("faculty")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle(); // ✅ safe

      if (faculty) {
        console.log("👨‍🏫 Faculty logged in");
        return { id: user.id, email: user.email || "", role: "faculty" };
      }

      // Default fallback
      console.log("🛠️ Admin assumed");
      return { id: user.id, email: user.email || "", role: "admin" };
    } catch (error) {
      console.error("❌ Failed to fetch user role:", error);
      return null;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        createSimpleProfile(session.user).then(setProfile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          createSimpleProfile(session.user).then(setProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log("Attempting sign in for:", email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    console.log("Sign in result:", error ? "Error" : "Success");
    return { error };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    console.log("Attempting sign up for:", email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Optional: metadata support
      // options: {
      //   data: userData,
      // },
    });
    console.log("Sign up result:", error ? "Error" : "Success");
    return { data, error };
  };

  const signOut = async () => {
    console.log("Signing out...");
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
