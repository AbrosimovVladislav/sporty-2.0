"use client";

import { useEffect, type ReactNode } from "react";

export function TelegramProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const twa = window.Telegram?.WebApp;
    if (!twa) return;
    twa.ready();
    twa.expand();
  }, []);

  return <>{children}</>;
}
