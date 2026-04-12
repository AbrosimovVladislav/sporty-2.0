"use client";

import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const auth = useAuth();

  const name = auth.status === "authenticated" ? auth.user.name : "";

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
        <p className="text-foreground-on-dark-muted text-sm uppercase font-display">Добро пожаловать</p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">{name}</h1>
      </div>

      <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        Команды и события появятся здесь
      </div>
    </div>
  );
}
