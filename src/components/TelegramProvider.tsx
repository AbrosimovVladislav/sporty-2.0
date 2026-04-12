"use client";

import { useEffect, useState, type ReactNode } from "react";

const TELEGRAM_SCRIPT_SRC = "https://telegram.org/js/telegram-web-app.js";

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function ensureTelegramScript() {
      if (window.Telegram?.WebApp) {
        return;
      }

      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${TELEGRAM_SCRIPT_SRC}"]`
      );

      if (existingScript) {
        await new Promise<void>((resolve, reject) => {
          existingScript.addEventListener("load", () => resolve(), { once: true });
          existingScript.addEventListener("error", () => reject(), { once: true });
        }).catch(() => undefined);
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = TELEGRAM_SCRIPT_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.head.appendChild(script);
      }).catch(() => undefined);
    }

    async function initTelegramSdk() {
      try {
        await ensureTelegramScript();
        const { init } = await import("@tma.js/sdk-react");
        init();
        if (!cancelled) {
          setReady(true);
        }
      } catch {
        // Not running inside Telegram — allow app to work in browser for dev
        console.warn("Telegram SDK init failed — running outside Telegram?");
        if (!cancelled) {
          setReady(true);
        }
      }
    }

    initTelegramSdk();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
