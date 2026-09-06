import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { User } from "@/lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  businessType: string | null;
  role: "admin" | "user" | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, businessType?: string) => Promise<{ message: string; email: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuth();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuth = async (retries = 2) => {
    try {
      const data = await api.get<{ user: User }>("/api/auth/me.php");
      setUser(data.user);
      setBusinessType(data.user.business_type || "products");
      setRole(data.user.role || "user");
      setLoading(false); // Success! Stop loading.
    } catch (err) {
      if (retries > 0) {
        console.log(`Auth check failed, retrying... (${retries} left)`);
        setTimeout(() => checkAuth(retries - 1), 1500);
      } else {
        console.error("Auth check failed after retries", err);
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false); // Final failure. Stop loading.
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const data = await api.post<{ user: User; token: string }>("/api/auth/login.php", { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setBusinessType(data.user.business_type || "products");
    setRole(data.user.role || "user");
  };

  const signUp = async (email: string, password: string, businessType?: string) => {
    return await api.post<{ message: string; email: string }>("/api/auth/register.php", { 
      email, 
      password, 
      business_type: businessType || "products" 
    });
  };

  const verifyOtp = async (email: string, otp: string) => {
    const data = await api.post<{ user: User; token: string }>("/api/auth/verify-otp.php", { email, otp });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setBusinessType(data.user.business_type || "products");
    setRole(data.user.role || "user");
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setBusinessType(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, businessType, role, signIn, signUp, verifyOtp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
