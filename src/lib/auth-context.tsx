"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@/types/database";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" };

const AuthContext = createContext<AuthState>({ status: "loading" });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    async function authenticate() {
      try {
        // Get initData from Telegram SDK
        const initData = window.Telegram?.WebApp?.initData;

        if (!initData) {
          // Running outside Telegram (dev mode) — skip auth
          setState({ status: "unauthenticated" });
          return;
        }

        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });

        if (!res.ok) {
          setState({ status: "unauthenticated" });
          return;
        }

        const { user } = await res.json();
        setState({ status: "authenticated", user });
      } catch {
        setState({ status: "unauthenticated" });
      }
    }

    authenticate();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
