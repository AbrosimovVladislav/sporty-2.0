"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function RootPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "loading") return;

    if (auth.status === "unauthenticated") {
      return;
    }

    if (auth.user.onboarding_completed) {
      router.replace("/home");
    } else {
      router.replace("/onboarding");
    }
  }, [auth, router]);

  if (auth.status === "unauthenticated") {
    return (
      <div className="flex flex-1 flex-col p-6 gap-6">
        <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
          <p className="text-foreground-on-dark-muted text-sm uppercase font-display">
            Browser Preview
          </p>
          <h1 className="text-3xl font-display font-bold uppercase mt-1">Sporty 2.0</h1>
        </div>

        <div className="bg-background-card border border-border rounded-lg p-6 flex flex-col gap-3">
          <p className="text-sm text-foreground-secondary">
            Вне Telegram авторизация недоступна, но UI можно посмотреть по экранам ниже.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/onboarding"
              className="block w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 text-center transition-colors hover:bg-primary-hover"
            >
              Открыть онбординг
            </Link>
            <Link
              href="/teams"
              className="block w-full bg-background-card border border-border font-display font-semibold uppercase rounded-full px-6 py-3 text-center transition-colors hover:border-primary"
            >
              Открыть команды
            </Link>
            <Link
              href="/team/test"
              className="block w-full bg-background-card border border-border font-display font-semibold uppercase rounded-full px-6 py-3 text-center transition-colors hover:border-primary"
            >
              Открыть экран команды
            </Link>
            <Link
              href="/profile"
              className="block w-full bg-background-card border border-border font-display font-semibold uppercase rounded-full px-6 py-3 text-center transition-colors hover:border-primary"
            >
              Открыть профиль игрока
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  );
}
