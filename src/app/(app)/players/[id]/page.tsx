"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import BackButton from "@/components/BackButton";
import {
  Button,
  BottomActionBar,
  PositionTag,
  RatingRing,
} from "@/components/ui";
import { positionCode, teamFallbackHue, type PositionCode } from "@/lib/playerBadges";
import { ratingTier, type RatingTier } from "@/lib/ratingTier";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";

type Player = {
  id: string;
  name: string;
  city: string | null;
  sport: string | null;
  position: string[] | null;
  skill_level: string | null;
  bio: string | null;
  birth_date: string | null;
  looking_for_team: boolean;
  rating: number | null;
  avatar_url: string | null;
};

type Stats = {
  playedCount: number;
  votedYesCount: number;
  attendedCount: number;
  reliability: number | null;
  recentEvents: {
    event_id: string;
    type: string;
    date: string;
    vote: string | null;
    attended: boolean | null;
  }[];
};

type PlayerTeam = {
  id: string;
  name: string;
  logo_url: string | null;
  city: string;
  role: "organizer" | "player";
};

type OrgTeam = { id: string; name: string; sport: string; city: string };

const TIER_LABEL: Record<RatingTier, string> = {
  elite: "Элитный",
  high: "Продвинутый",
  mid: "Средний",
  low: "Любитель",
  poor: "Новичок",
};

function calcAge(birthDate: string): number | null {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

function pluralYears(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "год";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "года";
  return "лет";
}

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const auth = useAuth();
  const currentUserId = auth.status === "authenticated" ? auth.user.id : null;

  const [player, setPlayer] = useState<Player | null | undefined>(undefined);
  const [stats, setStats] = useState<Stats | null>(null);
  const [teams, setTeams] = useState<PlayerTeam[] | null>(null);
  const [orgTeams, setOrgTeams] = useState<OrgTeam[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/players/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/users/${id}/stats`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/users/${id}/teams`).then((r) =>
        r.ok ? r.json() : { teams: [] },
      ),
    ]).then(([pd, sd, td]) => {
      setPlayer(pd?.player ?? null);
      setStats(sd ?? null);
      setTeams(td.teams ?? []);
    });
  }, [id]);

  useEffect(() => {
    if (!currentUserId) return;
    fetch(`/api/users/${currentUserId}/organizer-teams`)
      .then((r) => r.json())
      .then((d) => setOrgTeams(d.teams ?? []));
  }, [currentUserId]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function invite(teamId: string) {
    if (!currentUserId || inviting) return;
    setInviting(teamId);
    try {
      const res = await fetch(`/api/teams/${teamId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id, inviter_id: currentUserId }),
      });
      if (res.ok) {
        showToast("Приглашение отправлено");
        setSheetOpen(false);
      } else {
        const d = await res.json();
        showToast(
          d.error === "Pending request already exists"
            ? "Приглашение уже отправлено"
            : "Ошибка",
        );
      }
    } finally {
      setInviting(null);
    }
  }

  const isOwnProfile = currentUserId === id;
  const canInvite = !isOwnProfile && orgTeams !== null && orgTeams.length > 0;

  if (player === undefined) {
    return (
      <div className="flex flex-1 flex-col p-4 gap-3">
        <SkeletonBlock height={220} />
        <SkeletonBlock height={88} />
        <SkeletonBlock height={120} />
      </div>
    );
  }

  if (player === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[15px]" style={{ color: "var(--ink-500)" }}>
          Игрок не найден
        </p>
      </div>
    );
  }

  const age = player.birth_date ? calcAge(player.birth_date) : null;
  const tier = ratingTier(player.rating);
  const tierLabel = tier ? TIER_LABEL[tier] : "Без рейтинга";
  const positions = (player.position ?? [])
    .map(positionCode)
    .filter((c): c is PositionCode => c !== null);

  const playedCount = stats?.playedCount ?? 0;
  const reliabilityText =
    stats?.reliability != null ? `${stats.reliability}%` : "—";
  const teamsCount = teams?.length ?? 0;

  const metaParts: string[] = [];
  if (player.city) metaParts.push(player.city);
  if (age != null) metaParts.push(`${age} ${pluralYears(age)}`);

  return (
    <>
      <div className="flex flex-1 flex-col gap-3 px-4 py-4 pb-28">
        {/* Hero */}
        <Card className="relative px-5 pt-12 pb-5 flex flex-col items-center gap-3 text-center">
          <BackButton
            fallbackHref="/players"
            className="absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center z-10 bg-background-card shadow-card text-foreground"
          />

          <Avatar src={player.avatar_url} name={player.name} />

          <h1
            className="font-display font-bold uppercase wrap-break-word"
            style={{
              fontSize: 26,
              lineHeight: 1.05,
              letterSpacing: "0.01em",
              color: "var(--ink-900)",
            }}
          >
            {player.name}
          </h1>

          {metaParts.length > 0 && (
            <p className="text-[13px]" style={{ color: "var(--ink-500)" }}>
              {metaParts.join(" · ")}
            </p>
          )}

          {positions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {positions.map((c) => (
                <PositionTag key={c} code={c} />
              ))}
            </div>
          )}
        </Card>

        {/* Rating */}
        <Card className="p-4 flex items-center gap-4">
          <RatingRing rating={player.rating} size={72} />
          <div className="min-w-0 flex-1">
            <Eyebrow>Рейтинг</Eyebrow>
            <p
              className="text-[18px] font-bold leading-[1.2] mt-1"
              style={{ color: "var(--ink-900)" }}
            >
              {tierLabel}
            </p>
            {player.skill_level && (
              <p
                className="text-[12px] mt-0.5"
                style={{ color: "var(--ink-500)" }}
              >
                {player.skill_level}
              </p>
            )}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCell value={playedCount} label="Сыграно" />
          <StatCell value={reliabilityText} label="Надёжность" tone="primary" />
          <StatCell value={teamsCount} label="Команд" />
        </div>

        {/* Bio */}
        {player.bio && (
          <Card className="px-4 py-4">
            <Eyebrow>О себе</Eyebrow>
            <p
              className="text-[14px] mt-2 leading-snug whitespace-pre-wrap"
              style={{ color: "var(--ink-900)" }}
            >
              {player.bio}
            </p>
          </Card>
        )}

        {/* Teams */}
        {teams && teams.length > 0 && (
          <Card className="overflow-hidden">
            <Eyebrow className="px-4 pt-3.5 pb-1.5">
              {teams.length === 1 ? "Команда" : "Команды"}
            </Eyebrow>
            {teams.map((t, i) => (
              <Link
                key={t.id}
                href={`/team/${t.id}`}
                className="flex items-center gap-3 px-4 pb-3.5 active:opacity-70"
                style={{
                  paddingTop: i === 0 ? 6 : 14,
                  borderTop: i === 0 ? undefined : "1px solid var(--ink-100)",
                }}
              >
                <TeamLogo team={t} />
                <div className="flex-1 min-w-0">
                  <span
                    className="block text-[15px] font-semibold truncate"
                    style={{ color: "var(--ink-900)" }}
                  >
                    {t.name}
                  </span>
                  <span
                    className="block text-[12px] mt-0.5 truncate"
                    style={{ color: "var(--ink-500)" }}
                  >
                    {t.role === "organizer" ? "Организатор" : "Игрок"}
                    {t.city ? ` · ${t.city}` : ""}
                  </span>
                </div>
                <ChevronRight />
              </Link>
            ))}
          </Card>
        )}

        {/* Recent events */}
        {stats && stats.recentEvents.length > 0 && (
          <div>
            <Eyebrow className="mb-2 px-1">Последние события</Eyebrow>
            <Card className="overflow-hidden">
              {stats.recentEvents.map((e, i, arr) => {
                const typeLabel = EVENT_TYPE_LABEL[e.type] ?? e.type;
                const isLast = i === arr.length - 1;
                const status =
                  e.attended === true
                    ? {
                        label: "Был",
                        color: "var(--green-700)",
                        bg: "var(--green-50)",
                      }
                    : e.attended === false
                      ? {
                          label: "Не был",
                          color: "var(--danger)",
                          bg: "var(--danger-soft)",
                        }
                      : {
                          label: "Не голосовал",
                          color: "var(--ink-500)",
                          bg: "var(--ink-100)",
                        };
                return (
                  <div
                    key={e.event_id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom: isLast
                        ? undefined
                        : "1px solid var(--ink-100)",
                    }}
                  >
                    <CalendarIconBox />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[14px] font-semibold leading-tight"
                        style={{ color: "var(--ink-900)" }}
                      >
                        {typeLabel}
                      </p>
                      <p
                        className="text-[12px] mt-0.5"
                        style={{ color: "var(--ink-500)" }}
                      >
                        {formatLongDate(e.date)}
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-full text-[12px] font-semibold"
                      style={{ background: status.bg, color: status.color }}
                    >
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </Card>
          </div>
        )}
      </div>

      {canInvite && (
        <BottomActionBar>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setSheetOpen(true)}
          >
            Пригласить в команду
          </Button>
        </BottomActionBar>
      )}

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="relative pb-6 pt-2 max-h-[70vh] overflow-y-auto"
            style={{
              background: "var(--card)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
            }}
          >
            <div className="flex justify-center pb-2">
              <span
                className="block w-9 h-1 rounded-full"
                style={{ background: "var(--ink-300)" }}
              />
            </div>
            <p
              className="text-[16px] font-bold px-4 mb-3"
              style={{ color: "var(--ink-900)" }}
            >
              Выберите команду
            </p>
            <ul className="flex flex-col gap-2 px-4">
              {orgTeams!.map((t) => (
                <li key={t.id}>
                  <button
                    disabled={!!inviting}
                    onClick={() => invite(t.id)}
                    className="w-full flex items-center justify-between rounded-[12px] px-4 py-3 text-left disabled:opacity-50 transition-colors active:opacity-80"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--ink-200)",
                    }}
                  >
                    <div>
                      <p
                        className="text-[15px] font-semibold"
                        style={{ color: "var(--ink-900)" }}
                      >
                        {t.name}
                      </p>
                      <p
                        className="text-[12px] mt-0.5"
                        style={{ color: "var(--ink-500)" }}
                      >
                        {t.city}
                      </p>
                    </div>
                    {inviting === t.id && (
                      <div
                        className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: "var(--green-700)" }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 text-[13px] px-4 py-2 rounded-[10px]"
          style={{
            background: "var(--ink-900)",
            color: "white",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}

// ─── atoms ────────────────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[16px] ${className}`}
      style={{
        background: "var(--card)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {children}
    </div>
  );
}

function Eyebrow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase ${className}`}
      style={{ letterSpacing: "0.06em", color: "var(--ink-500)" }}
    >
      {children}
    </p>
  );
}

function SkeletonBlock({ height }: { height: number }) {
  return (
    <div
      className="rounded-[16px] animate-pulse"
      style={{ height, background: "var(--ink-100)" }}
    />
  );
}

function StatCell({
  value,
  label,
  tone = "default",
}: {
  value: string | number;
  label: string;
  tone?: "default" | "primary";
}) {
  const valueColor =
    tone === "primary" ? "var(--green-700)" : "var(--ink-900)";
  return (
    <Card className="px-3 py-3.5 text-center">
      <p
        className="font-display text-[24px] font-bold leading-none tabular-nums"
        style={{ color: valueColor }}
      >
        {value}
      </p>
      <p className="text-[11px] mt-1" style={{ color: "var(--ink-500)" }}>
        {label}
      </p>
    </Card>
  );
}

function Avatar({ src, name }: { src: string | null; name: string }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const SIZE = 112;
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center"
      style={{
        width: SIZE,
        height: SIZE,
        background: src ? "white" : "var(--ink-100)",
        border: "1px solid var(--ink-200)",
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={name}
          width={SIZE}
          height={SIZE}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="font-display text-[40px] font-bold"
          style={{ color: "var(--ink-500)" }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}

function TeamLogo({ team }: { team: PlayerTeam }) {
  const initial = team.name.trim().charAt(0).toUpperCase() || "?";

  if (team.logo_url) {
    return (
      <span
        className="inline-block rounded-[12px] overflow-hidden bg-white shrink-0"
        style={{ width: 44, height: 44 }}
      >
        <Image
          src={team.logo_url}
          alt={team.name}
          width={44}
          height={44}
          className="w-full h-full object-cover"
        />
      </span>
    );
  }

  const hue = teamFallbackHue(team.id);
  return (
    <span
      className="inline-flex items-center justify-center rounded-[12px] text-white font-display font-extrabold shrink-0"
      style={{
        width: 44,
        height: 44,
        background: `oklch(0.55 0.15 ${hue})`,
        fontSize: 18,
        lineHeight: 1,
      }}
    >
      {initial}
    </span>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink-400)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function CalendarIconBox() {
  return (
    <div
      className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
      style={{ background: "var(--green-50)" }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--green-700)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </div>
  );
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
