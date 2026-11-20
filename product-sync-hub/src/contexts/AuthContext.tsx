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
  updateProfile: (profileData: Partial<User>) => Promise<{ message: string; user: User }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function syncProfileToStorage(userData?: User | null) {
  if (!userData || typeof window === "undefined") return;
  try {
    const profileToStore = {
      company_name: userData.company_name || "",
      company_logo: userData.company_logo || "",
      company_phone: userData.company_phone || "",
      company_email: userData.company_email || userData.email || "",
      company_address: userData.company_address || "",
      company_website: userData.company_website || "",
      company_facebook: userData.company_facebook || "",
      company_instagram: userData.company_instagram || "",
      bank_name: userData.bank_name || "",
      bank_account_name: userData.bank_account_name || "",
      bank_account_no: userData.bank_account_no || "",
      bank_ifsc: userData.bank_ifsc || "",
      bank_upi_id: userData.bank_upi_id || "",
      bank_qr: userData.bank_qr || "",
      reviews_banner: userData.reviews_banner || ""
    };
    localStorage.setItem("agency_company_profile", JSON.stringify(profileToStore));
    if (userData.company_logo) {
      localStorage.setItem("agency_company_logo_data", userData.company_logo);
    }
    if (userData.bank_qr) {
      localStorage.setItem("agency_bank_qr_data", userData.bank_qr);
    }
    if (userData.reviews_banner) {
      localStorage.setItem("agency_reviews_banner_data", userData.reviews_banner);
    }
    window.dispatchEvent(new Event("agency_profile_updated"));
  } catch {}
}

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
      syncProfileToStorage(data.user);
      const bType = data.user.business_type === "hotel" ? "hotel" : "travel";
      setBusinessType(bType);
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
    syncProfileToStorage(data.user);
    const bType = data.user.business_type === "hotel" ? "hotel" : "travel";
    setBusinessType(bType);
    setRole(data.user.role || "user");
  };

  const signUp = async (email: string, password: string, businessType?: string) => {
    return await api.post<{ message: string; email: string }>("/api/auth/register.php", { 
      email, 
      password, 
      business_type: businessType || "travel" 
    });
  };

  const verifyOtp = async (email: string, otp: string) => {
    const data = await api.post<{ user: User; token: string }>("/api/auth/verify-otp.php", { email, otp });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    syncProfileToStorage(data.user);
    const bType = data.user.business_type === "hotel" ? "hotel" : "travel";
    setBusinessType(bType);
    setRole(data.user.role || "user");
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    try {
      localStorage.removeItem('agency_company_profile');
      localStorage.removeItem('agency_company_logo_data');
      localStorage.removeItem('agency_bank_qr_data');
      localStorage.removeItem('agency_reviews_banner_data');
    } catch {}
    setUser(null);
    setBusinessType(null);
    setRole(null);
  };

  const updateProfile = async (profileData: Partial<User>) => {
    const res = await api.post<{ message: string; user: User }>("/api/auth/update_profile.php", profileData);
    if (res.user) {
      setUser(res.user);
      syncProfileToStorage(res.user);
    }
    return res;
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider value={{ user, loading, businessType, role, signIn, signUp, verifyOtp, signOut, updateProfile, refreshUser }}>
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
