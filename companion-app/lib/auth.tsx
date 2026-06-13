// auth.tsx — minimal auth context (Phase-3 task: parent login).
// Stores a session token in SecureStore. This is a placeholder sign-in; wire it to
// the real backend (e.g. the Next.js /api auth) before production.
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import { STORAGE } from "./constants";

type AuthState = {
  token: string | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE.AUTH_TOKEN)
      .then((t) => setToken(t))
      .finally(() => setLoading(false));
  }, []);

  async function signIn(email: string) {
    // TODO: exchange credentials with the backend for a real session token.
    const fakeToken = `dev-${email}-${Date.now()}`;
    await SecureStore.setItemAsync(STORAGE.AUTH_TOKEN, fakeToken);
    setToken(fakeToken);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(STORAGE.AUTH_TOKEN);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
