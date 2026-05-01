"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@/types/database";

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: User }
  | { status: "unauthenticated" };

const AuthContext = createContext<AuthState>({ status: "loading" });

const SESSION_USER_KEY = "sporty.auth.user";

function readCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function writeCachedUser(user: User | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) window.sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    else window.sessionStorage.removeItem(SESSION_USER_KEY);
  } catch {
    /* ignore quota / disabled storage */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const cached = readCachedUser();
    return cached ? { status: "authenticated", user: cached } : { status: "loading" };
  });

  useEffect(() => {
    let cancelled = false;

    async function authenticate() {
      try {
        const initData = window.Telegram?.WebApp?.initData;

        if (!initData) {
          if (cancelled) return;
          writeCachedUser(null);
          setState({ status: "unauthenticated" });
          return;
        }

        const res = await fetch("/api/auth/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });

        if (cancelled) return;

        if (!res.ok) {
          writeCachedUser(null);
          setState({ status: "unauthenticated" });
          return;
        }

        const { user } = (await res.json()) as { user: User };
        if (cancelled) return;

        writeCachedUser(user);
        setState({ status: "authenticated", user });
      } catch {
        if (cancelled) return;
        writeCachedUser(null);
        setState({ status: "unauthenticated" });
      }
    }

    authenticate();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
