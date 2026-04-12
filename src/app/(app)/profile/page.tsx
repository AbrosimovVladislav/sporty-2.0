"use client";

import { useAuth } from "@/lib/auth-context";

export default function ProfilePage() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (auth.status !== "authenticated") {
    return null;
  }

  const { user } = auth;

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
        <p className="text-foreground-on-dark-muted text-sm uppercase font-display">Профиль</p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">{user.name}</h1>
      </div>

      <div className="flex flex-col gap-3">
        {user.city && (
          <div className="bg-background-card border border-border rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-foreground-secondary text-sm">Город</span>
            <span className="text-foreground font-medium">{user.city}</span>
          </div>
        )}
        {user.sport && (
          <div className="bg-background-card border border-border rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="text-foreground-secondary text-sm">Вид спорта</span>
            <span className="text-foreground font-medium">{user.sport}</span>
          </div>
        )}
      </div>
    </div>
  );
}
