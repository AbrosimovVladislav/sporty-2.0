"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import EventsTab from "./EventsTab";
import TeamsTab from "./TeamsTab";
import VenuesTab from "./VenuesTab";

type Tab = "events" | "teams" | "venues";

function isTab(v: string | null): v is Tab {
  return v === "events" || v === "teams" || v === "venues";
}

export default function SearchPage() {
  const params = useSearchParams();
  const initialTab = params.get("tab");
  const [tab, setTab] = useState<Tab>(isTab(initialTab) ? initialTab : "events");

  return (
    <div className="flex flex-1 flex-col p-4 gap-4">
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-5">
        <p className="text-foreground-on-dark-muted text-xs uppercase font-display tracking-wide">
          Поиск
        </p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">Найти</h1>
      </div>

      <div className="flex gap-2">
        {(
          [
            { id: "events", label: "События" },
            { id: "teams", label: "Команды" },
            { id: "venues", label: "Площадки" },
          ] as { id: Tab; label: string }[]
        ).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-primary text-primary-foreground"
                : "bg-background-card text-foreground border border-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "events" && <EventsTab />}
      {tab === "teams" && <TeamsTab />}
      {tab === "venues" && <VenuesTab />}
    </div>
  );
}
