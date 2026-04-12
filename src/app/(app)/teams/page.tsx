"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

type Section = "mine" | "all";

export default function TeamsPage() {
  const auth = useAuth();
  const [section, setSection] = useState<Section>("mine");

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
        <p className="text-foreground-on-dark-muted text-sm uppercase font-display">Команды</p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">
          {section === "mine" ? "Мои команды" : "Все команды"}
        </h1>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setSection("mine")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            section === "mine"
              ? "bg-primary text-primary-foreground"
              : "bg-background-card text-foreground border border-border"
          }`}
        >
          Мои
        </button>
        <button
          onClick={() => setSection("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            section === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-background-card text-foreground border border-border"
          }`}
        >
          Все
        </button>
      </div>

      {section === "mine" ? (
        <MineSection onFindTeams={() => setSection("all")} />
      ) : (
        <AllSection />
      )}
    </div>
  );
}

function MineSection({ onFindTeams }: { onFindTeams: () => void }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        Ты пока не в команде
      </div>

      <button
        onClick={onFindTeams}
        className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 transition-colors hover:bg-primary-hover"
      >
        Найти команду
      </button>

      <div className="mt-auto text-center">
        <Link
          href="/teams/create"
          className="text-sm text-foreground-secondary underline underline-offset-4"
        >
          Создать свою команду
        </Link>
      </div>
    </div>
  );
}

function AllSection() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm text-foreground-secondary">Город</label>
        <input
          type="text"
          placeholder="Любой город"
          className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
        />
      </div>

      <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        Команды появятся здесь
      </div>
    </div>
  );
}
