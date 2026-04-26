"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SearchIcon, ShieldIcon } from "@/components/Icons";
import { SkeletonCard } from "@/components/Skeleton";
import { EVENT_TYPE_LABEL, SPORT_LABEL } from "@/lib/catalogs";
import { PhotoBanner } from "@/components/ui/PhotoBanner";
import { Pill } from "@/components/ui/Pill";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";

type MyTeam = {
  id: string;
  name: string;
  city: string;
  sport: string;
  role: "organizer" | "player";
};

type NextEvent = {
  id: string;
  type: string;
  date: string;
  team_id: string;
  price_per_player: number;
  min_players: number;
  is_public: boolean;
  team: { id: string; name: string } | null;
  venue: { id: string; name: string; address: string } | null;
  yes_count: number;
  user_vote: "yes" | "no" | null;
};

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  const weekday = d.toLocaleDateString("ru-RU", { weekday: "long" });
  const day = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  return `${weekday}, ${day} в ${time}`;
}

function formatPrice(price: number): string {
  if (price === 0) return "Бесплатно";
  return `${price.toLocaleString("ru-RU")} ₸`;
}

function getEventTypeVariant(type: string): "status" | "statusMuted" {
  return type === "game" ? "status" : "statusMuted";
}

export default function HomePage() {
  const auth = useAuth();
  const router = useRouter();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const name = auth.status === "authenticated" ? auth.user.name : "";
  const city = auth.status === "authenticated" ? auth.user.city : null;

  const [teams, setTeams] = useState<MyTeam[] | null>(null);
  const [nextEvent, setNextEvent] = useState<NextEvent | null | undefined>(undefined);
  const [voting, setVoting] = useState(false);

  // Handle deep-link from Telegram notification
  useEffect(() => {
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (!startParam) return;
    const match = startParam.match(/^event_([^_]+)_(.+)$/);
    if (match) {
      router.replace(`/team/${match[1]}/events/${match[2]}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userId) {
      setTeams([]);
      setNextEvent(null);
      return;
    }

    let cancelled = false;

    fetch(`/api/users/${userId}/teams`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setTeams(d.teams ?? []); })
      .catch(() => { if (!cancelled) setTeams([]); });

    fetch(`/api/users/${userId}/next-event`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setNextEvent(d.event ?? null); })
      .catch(() => { if (!cancelled) setNextEvent(null); });

    return () => { cancelled = true; };
  }, [userId]);

  async function handleVote(vote: "yes" | "no") {
    if (!userId || !nextEvent || voting) return;
    setVoting(true);
    try {
      const res = await fetch(
        `/api/teams/${nextEvent.team_id}/events/${nextEvent.id}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, vote }),
        }
      );
      if (res.ok) {
        setNextEvent((prev) =>
          prev
            ? {
                ...prev,
                user_vote: vote,
                yes_count: vote === "yes" ? prev.yes_count + 1 : prev.user_vote === "yes" ? prev.yes_count - 1 : prev.yes_count,
              }
            : prev
        );
      }
    } finally {
      setVoting(false);
    }
  }

  const showEmptyState =
    teams !== null && teams.length === 0 && nextEvent === null;

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-4">

      {/* 25.1 Welcome header */}
      <div>
        <h1 className="text-[28px] font-bold leading-tight">
          Привет, {name || "…"}
        </h1>
        {city && (
          <p className="text-[13px] text-foreground-secondary mt-0.5">{city}</p>
        )}
      </div>

      {/* 25.2 + 25.3 Next event */}
      <section>
        {nextEvent === undefined ? (
          <SkeletonCard className="h-40" />
        ) : nextEvent ? (
          <div className="flex flex-col gap-3">
            <Link href={`/team/${nextEvent.team_id}/events/${nextEvent.id}`}>
              <PhotoBanner
                fallback="event"
                statusPills={[
                  <Pill key="type" variant={getEventTypeVariant(nextEvent.type)}>
                    {EVENT_TYPE_LABEL[nextEvent.type] ?? nextEvent.type}
                  </Pill>,
                  <Pill key="status" variant="statusMuted">
                    Запланировано
                  </Pill>,
                ]}
                overlayContent={
                  <>
                    <p className="text-[20px] font-semibold leading-tight">
                      {formatEventDate(nextEvent.date)}
                    </p>
                    {nextEvent.venue && (
                      <p className="text-[14px] opacity-90 mt-1">
                        📍 {nextEvent.venue.name}
                      </p>
                    )}
                    {nextEvent.team && (
                      <p className="text-[13px] opacity-75 mt-0.5">
                        {nextEvent.team.name}
                      </p>
                    )}
                  </>
                }
              />
            </Link>

            {/* Triplet metric */}
            <Card padding="md">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[15px] font-semibold tabular-nums">
                    {formatPrice(nextEvent.price_per_player)}
                  </p>
                  <p className="text-[12px] text-foreground-secondary mt-0.5">взнос</p>
                </div>
                <div>
                  <p className="text-[15px] font-semibold tabular-nums">
                    {nextEvent.min_players}
                  </p>
                  <p className="text-[12px] text-foreground-secondary mt-0.5">мин. игроков</p>
                </div>
                <div>
                  <p className="text-[15px] font-semibold tabular-nums">
                    {nextEvent.yes_count} / {nextEvent.min_players}
                  </p>
                  <div className="mt-1.5 h-1.5 bg-background-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${Math.min(100, (nextEvent.yes_count / Math.max(nextEvent.min_players, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* 25.3 Vote buttons */}
            {nextEvent.user_vote === null && (
              <Card padding="md">
                <p className="text-[13px] text-foreground-secondary text-center mb-3">
                  Вы ещё не ответили
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={nextEvent.user_vote === "yes" ? "primary" : "secondary"}
                    loading={voting}
                    onClick={() => handleVote("yes")}
                  >
                    Приду
                  </Button>
                  <Button
                    variant="secondary"
                    loading={voting}
                    onClick={() => handleVote("no")}
                  >
                    Не приду
                  </Button>
                </div>
              </Card>
            )}

            {nextEvent.user_vote !== null && (
              <Card padding="md">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={nextEvent.user_vote === "yes" ? "primary" : "secondary"}
                    loading={voting}
                    onClick={() => handleVote("yes")}
                  >
                    Приду
                  </Button>
                  <Button
                    variant={nextEvent.user_vote === "no" ? "danger" : "secondary"}
                    loading={voting}
                    onClick={() => handleVote("no")}
                  >
                    Не приду
                  </Button>
                </div>
                <p className="text-[13px] text-foreground-secondary text-center mt-2">
                  {nextEvent.user_vote === "yes" ? "Вы идёте" : "Вы не идёте"}
                </p>
              </Card>
            )}
          </div>
        ) : null}
      </section>

      {/* 25.4 Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/search">
          <div className="bg-primary text-primary-foreground rounded-lg p-4 flex flex-col items-center gap-2 shadow-card">
            <SearchIcon />
            <span className="text-[15px] font-semibold">Найти игру</span>
          </div>
        </Link>
        <Link href="/teams">
          <div className="bg-background-card text-foreground border border-border rounded-lg p-4 flex flex-col items-center gap-2 shadow-card">
            <ShieldIcon />
            <span className="text-[15px] font-semibold">Команды</span>
          </div>
        </Link>
      </div>

      {/* 25.5 My teams */}
      {teams !== null && teams.length > 0 && (
        <section>
          <SectionEyebrow tone="muted" className="mb-2">Мои команды</SectionEyebrow>
          <Card padding="sm">
            <ul className="divide-y divide-border">
              {teams.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/team/${t.id}`}
                    className="flex items-center justify-between py-3 px-1 min-h-[44px]"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold truncate">{t.name}</p>
                      <p className="text-[13px] text-foreground-secondary truncate">
                        {t.city} · {SPORT_LABEL[t.sport] ?? t.sport}
                      </p>
                    </div>
                    <Pill variant={t.role === "organizer" ? "role" : "filterActive"} className="ml-3 shrink-0">
                      {t.role === "organizer" ? "Организатор" : "Игрок"}
                    </Pill>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* 25.6 Empty state */}
      {showEmptyState && (
        <EmptyState
          icon={<ShieldIcon />}
          text="Вступи в команду или найди матч, чтобы начать"
          action={{ label: "Найти игру", onClick: () => router.push("/search") }}
        />
      )}
    </div>
  );
}
