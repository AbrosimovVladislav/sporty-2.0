"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

const SPORT_LABEL: Record<string, string> = {
  football: "Футбол",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "На рассмотрении",
  accepted: "Принята",
  rejected: "Отклонена",
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-primary/10 text-primary",
  accepted: "bg-green-500/10 text-green-600",
  rejected: "bg-red-500/10 text-red-500",
};

type JoinRequestItem = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  team: { id: string; name: string; city: string; sport: string };
};

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

      <MyJoinRequests userId={user.id} />
    </div>
  );
}

function MyJoinRequests({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<JoinRequestItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${userId}/join-requests`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setRequests(d.requests ?? []);
      })
      .catch(() => {
        if (!cancelled) setRequests([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <section>
      <p className="text-xs uppercase font-display text-foreground-secondary mb-2">Мои заявки</p>

      {requests === null ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Загружаю…
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Заявок пока нет
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {requests.map((r) => (
            <li key={r.id}>
              <Link
                href={`/team/${r.team.id}`}
                className="block bg-background-card border border-border rounded-lg px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{r.team.name}</p>
                    <p className="text-xs text-foreground-secondary mt-0.5">
                      {r.team.city} · {SPORT_LABEL[r.team.sport] ?? r.team.sport}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-display font-semibold uppercase px-2 py-1 rounded ${STATUS_STYLE[r.status] ?? ""}`}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
