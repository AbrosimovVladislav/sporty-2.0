"use client";

import { useEffect, useState, type ReactNode } from "react";

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const twa = window.Telegram?.WebApp;
    if (twa) {
      twa.ready();
      twa.expand();
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
