"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { SkeletonCard, SkeletonList } from "@/components/Skeleton";
import BackButton from "@/components/BackButton";
import { Button, BottomActionBar } from "@/components/ui";
import { LevelChip } from "@/components/players/badges/LevelChip";
import { PositionBadge } from "@/components/players/badges/PositionBadge";
import {
  levelFromRating,
  positionCode,
  skillToNum,
  type PositionCode,
} from "@/lib/playerBadges";
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

type OrgTeam = { id: string; name: string; sport: string; city: string };

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
  const [orgTeams, setOrgTeams] = useState<OrgTeam[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/players/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/users/${id}/stats`).then((r) => (r.ok ? r.json() : null)),
    ]).then(([pd, sd]) => {
      setPlayer(pd?.player ?? null);
      setStats(sd ?? null);
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
      <div
        className="flex flex-1 flex-col p-4 gap-3"
        style={{ background: "var(--bg-secondary)" }}
      >
        <SkeletonCard className="h-72" />
        <SkeletonList count={2} />
      </div>
    );
  }

  if (player === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p
          className="text-[15px]"
          style={{ color: "var(--text-secondary)" }}
        >
          Игрок не найден
        </p>
      </div>
    );
  }

  const age = player.birth_date ? calcAge(player.birth_date) : null;
  const levelCode = levelFromRating(player.rating);
  const positions = (player.position ?? [])
    .map(positionCode)
    .filter((c): c is PositionCode => c !== null);
  const skillNum = skillToNum(player.skill_level);
  const hasBadges = !!levelCode || positions.length > 0;

  return (
    <>
      <div
        className="flex flex-1 flex-col gap-3 px-4 py-4 pb-28"
        style={{ background: "var(--bg-secondary)" }}
      >
        <Card className="relative px-5 pt-5 pb-6 flex flex-col items-center gap-4">
          <BackButton
            fallbackHref="/players"
            className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center z-10 bg-background-card shadow-card text-foreground"
          />

          <AvatarWithRating
            src={player.avatar_url}
            name={player.name}
            rating={player.rating}
          />

          <h1
            className="font-display font-bold uppercase text-center wrap-break-word"
            style={{
              fontSize: 28,
              lineHeight: 1.05,
              letterSpacing: "0.01em",
              color: "var(--text-primary)",
            }}
          >
            {player.name}
          </h1>

          {player.city && (
            <p
              className="inline-flex items-center gap-1.5 text-[14px]"
              style={{ color: "var(--text-secondary)" }}
            >
              <PinIcon />
              {player.city}
            </p>
          )}

          {hasBadges && (
            <div className="flex flex-wrap gap-2 justify-center">
              {levelCode && (
                <LevelChip
                  code={levelCode}
                  skillLabel={player.skill_level}
                  skillNum={skillNum}
                />
              )}
              {positions.map((c) => (
                <PositionBadge key={c} code={c} />
              ))}
            </div>
          )}
        </Card>

        {age !== null && (
          <Card className="px-5 py-4">
            <Eyebrow>О себе</Eyebrow>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p
                  className="text-[13px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Возраст
                </p>
                <p
                  className="text-[18px] font-bold mt-0.5"
                  style={{ color: "var(--text-primary)" }}
                >
                  {age} {pluralYears(age)}
                </p>
              </div>
              <CakeIcon />
            </div>
          </Card>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <Card className="px-4 py-4 flex items-center gap-3">
              <IconCircle bg="var(--gray-100)">
                <BallIcon />
              </IconCircle>
              <div>
                <p
                  className="font-display text-[28px] font-bold leading-none tabular-nums"
                  style={{ color: "var(--text-primary)" }}
                >
                  {stats.playedCount}
                </p>
                <p
                  className="text-[13px] mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Сыграно
                </p>
              </div>
            </Card>
            <Card className="px-4 py-4 flex items-center gap-3">
              <IconCircle bg="var(--green-100)">
                <ShieldIcon />
              </IconCircle>
              <div>
                <p
                  className="font-display text-[28px] font-bold leading-none tabular-nums"
                  style={{
                    color:
                      stats.reliability !== null
                        ? "var(--green-600)"
                        : "var(--text-tertiary)",
                  }}
                >
                  {stats.reliability !== null ? `${stats.reliability}%` : "—"}
                </p>
                <p
                  className="text-[13px] mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Надёжность
                </p>
              </div>
            </Card>
          </div>
        )}

        {stats && stats.votedYesCount > 0 && (
          <Card className="px-4 py-3.5 flex items-center gap-3">
            <CheckCircle />
            <p
              className="text-[14px] leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              Посетил {stats.attendedCount} из {stats.votedYesCount} записанных
              событий
            </p>
          </Card>
        )}

        {stats && stats.recentEvents.length > 0 && (
          <div className="mt-1">
            <Eyebrow className="mb-2.5 px-1">Последние события</Eyebrow>
            <Card className="overflow-hidden">
              {stats.recentEvents.map((e, i, arr) => {
                const typeLabel = EVENT_TYPE_LABEL[e.type] ?? e.type;
                const isLast = i === arr.length - 1;
                const status =
                  e.attended === true
                    ? { label: "Был", color: "var(--green-700)", bg: "var(--green-100)" }
                    : e.attended === false
                      ? { label: "Не был", color: "var(--danger)", bg: "#FFE5E5" }
                      : {
                          label: "Не голосовал",
                          color: "var(--text-tertiary)",
                          bg: "var(--gray-100)",
                        };
                return (
                  <div
                    key={e.event_id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom: isLast
                        ? undefined
                        : "1px solid var(--gray-100)",
                    }}
                  >
                    <CalendarIcon />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[15px] font-semibold leading-tight"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {typeLabel}
                      </p>
                      <p
                        className="text-[13px] mt-0.5"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatLongDate(e.date)}
                      </p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-[13px] font-semibold"
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
            className="relative bg-white rounded-t-2xl p-5 flex flex-col gap-3 max-h-[70vh] overflow-y-auto"
            style={{ boxShadow: "0 -8px 24px rgba(0,0,0,0.12)" }}
          >
            <div
              className="w-10 h-1 rounded-full mx-auto mb-1"
              style={{ background: "var(--gray-300)" }}
            />
            <p className="text-[17px] font-semibold">Выбери команду</p>
            <ul className="flex flex-col gap-2">
              {orgTeams!.map((t) => (
                <li key={t.id}>
                  <button
                    disabled={!!inviting}
                    onClick={() => invite(t.id)}
                    className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-left disabled:opacity-50"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--gray-200)",
                    }}
                  >
                    <div>
                      <p className="text-[15px] font-medium">{t.name}</p>
                      <p
                        className="text-[13px] mt-0.5"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {t.city}
                      </p>
                    </div>
                    {inviting === t.id && (
                      <div
                        className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: "var(--primary)" }}
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
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 text-[14px] px-4 py-2 rounded-lg"
          style={{
            background: "var(--text-primary)",
            color: "white",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
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
        background: "var(--bg-primary)",
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
      style={{
        letterSpacing: "0.06em",
        color: "var(--text-tertiary)",
      }}
    >
      {children}
    </p>
  );
}

function AvatarWithRating({
  src,
  name,
  rating,
}: {
  src: string | null;
  name: string;
  rating: number | null;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const SIZE = 144;
  return (
    <div
      className="relative shrink-0"
      style={{ width: SIZE, height: SIZE }}
    >
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: src ? "white" : "var(--gray-100)",
          border: "1px solid var(--gray-200)",
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
            className="font-display text-[48px] font-bold"
            style={{ color: "var(--text-secondary)" }}
          >
            {initial}
          </span>
        )}
      </div>
      {rating != null && (
        <div
          className="absolute flex items-center justify-center font-display tabular-nums"
          style={{
            right: 4,
            bottom: 4,
            width: 44,
            height: 44,
            borderRadius: "9999px",
            background: "var(--text-primary)",
            color: "white",
            border: "3px solid white",
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {rating}
        </div>
      )}
    </div>
  );
}

function IconCircle({
  bg,
  children,
}: {
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
      style={{ background: bg }}
    >
      {children}
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

// ─── icons ────────────────────────────────────────────────────────────────────

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CakeIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-tertiary)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
      <path d="M2 21h20" />
      <path d="M7 8v3" />
      <path d="M12 8v3" />
      <path d="M17 8v3" />
      <path d="M7 4v2" />
      <path d="M12 4v2" />
      <path d="M17 4v2" />
    </svg>
  );
}

function BallIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-secondary)"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <polygon points="12,8 15,10.2 13.9,13.7 10.1,13.7 9,10.2" fill="var(--text-secondary)" stroke="none" />
      <line x1="12" y1="3" x2="12" y2="8" />
      <line x1="20.3" y1="9" x2="15" y2="10.2" />
      <line x1="3.7" y1="9" x2="9" y2="10.2" />
      <line x1="18.5" y1="18.5" x2="13.9" y2="13.7" />
      <line x1="5.5" y1="18.5" x2="10.1" y2="13.7" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--green-600)"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
      style={{ background: "var(--green-500)" }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </div>
  );
}

function CalendarIcon() {
  return (
    <div
      className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
      style={{ background: "var(--green-100)" }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--green-600)"
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
