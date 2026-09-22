"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import type { AppUser } from "@/lib/types";

type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const DEMO_KEY = "rankingbr_demo_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      const hasDemoSession = window.localStorage.getItem(DEMO_KEY) === "true";
      if (hasDemoSession) {
        setUser({
          uid: "demo-dev",
          nome: "Pedro",
          email: "demo@rankingbr.local",
          perfil: "DEV",
          ativo: true,
          demo: true,
        });
      }
      setLoading(false);
      return;
    }

    const authInstance = auth;
    const dbInstance = db;

    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profileSnapshot = await getDoc(doc(dbInstance, "usuarios", firebaseUser.uid));
        if (!profileSnapshot.exists()) {
          await signOut(authInstance);
          setUser(null);
          return;
        }

        const profile = profileSnapshot.data() as Omit<AppUser, "uid" | "email">;
        if (!profile.ativo) {
          await signOut(authInstance);
          setUser(null);
          return;
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          nome: profile.nome,
          perfil: profile.perfil,
          ativo: profile.ativo,
        });
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      login: async (email, password) => {
        if (!auth) throw new Error("Firebase ainda não foi configurado.");
        await signInWithEmailAndPassword(auth, email, password);
      },
      loginDemo: () => {
        const demoUser: AppUser = {
          uid: "demo-dev",
          nome: "Pedro",
          email: "demo@rankingbr.local",
          perfil: "DEV",
          ativo: true,
          demo: true,
        };
        window.localStorage.setItem(DEMO_KEY, "true");
        setUser(demoUser);
      },
      logout: async () => {
        window.localStorage.removeItem(DEMO_KEY);
        if (auth) await signOut(auth);
        setUser(null);
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
