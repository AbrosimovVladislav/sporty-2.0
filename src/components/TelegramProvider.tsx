"use client";

import { useEffect, useState, type ReactNode } from "react";

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function initTelegramSDK() {
      try {
        const { init } = await import("@tma.js/sdk-react");
        init();
        setReady(true);
      } catch {
        // Not running inside Telegram — allow app to work in browser for dev
        console.warn("Telegram SDK init failed — running outside Telegram?");
        setReady(true);
      }
    }

    initTelegramSDK();
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
