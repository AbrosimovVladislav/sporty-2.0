"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function TeamsPage() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
        <p className="text-foreground-on-dark-muted text-sm uppercase font-display">Мои команды</p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">Команды</h1>
      </div>

      <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        Твои команды появятся здесь
      </div>

      <div className="mt-auto">
        <Link
          href="/onboarding/team"
          className="block w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 text-center transition-colors hover:bg-primary-hover"
        >
          Создать команду
        </Link>
      </div>
    </div>
  );
}
