"use client";

import { use } from "react";

export default function RosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
        <p className="text-foreground-on-dark-muted text-sm uppercase font-display">Команда</p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">Состав</h1>
      </div>

      <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        Игроки команды появятся здесь
      </div>
    </div>
  );
}
