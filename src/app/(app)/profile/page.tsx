"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { CircularProgress } from "@/components/CircularProgress";
import type { User } from "@/types/database";

type Tab = "about" | "results" | "reliability" | "settings";

const SPORT_LABEL: Record<string, string> = { football: "Футбол" };
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
const EVENT_TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

type JoinRequestItem = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  team: { id: string; name: string; city: string; sport: string };
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

/* ─── Root ─────────────────────────────────────────────────── */

export default function ProfilePage() {
  const auth = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }
  if (auth.status !== "authenticated") return null;

  return <ProfileContent initialUser={auth.user} />;
}

/* ─── Profile shell ────────────────────────────────────────── */

function ProfileContent({ initialUser }: { initialUser: User }) {
  const [user, setUser] = useState(initialUser);
  const [tab, setTab] = useState<Tab>("about");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/users/${user.id}/avatar`, { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function saveProfile(fields: Partial<Pick<User, "bio" | "birth_date" | "position" | "skill_level" | "preferred_time" | "looking_for_team">>) {
    const res = await fetch(`/api/users/${user.id}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "about", label: "Обо мне" },
    { id: "results", label: "Результаты" },
    { id: "reliability", label: "Надёжность" },
    { id: "settings", label: "Настройки" },
  ];

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero header */}
      <div className="bg-background-dark text-foreground-on-dark px-5 pt-10 pb-6">
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative w-20 h-20 rounded-full overflow-hidden bg-background-dark-elevated flex items-center justify-center group"
            >
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <span className="text-2xl font-display font-bold text-foreground-on-dark-muted">
                  {initials}
                </span>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <CameraIcon />
                )}
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Name + badges */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-display font-bold uppercase leading-none truncate">
              {user.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {user.city && (
                <span className="flex items-center gap-1 text-xs text-foreground-on-dark-muted bg-background-dark-elevated rounded-full px-3 py-1">
                  <span className="opacity-60">⊙</span> {user.city}
                </span>
              )}
              {user.sport && (
                <span className="flex items-center gap-1 text-xs text-foreground-on-dark-muted bg-background-dark-elevated rounded-full px-3 py-1">
                  {SPORT_LABEL[user.sport] ?? user.sport}
                </span>
              )}
              {user.looking_for_team && (
                <span className="flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded-full px-3 py-1 font-medium">
                  <span className="opacity-80">⚑</span> Ищет команду
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 bg-background overflow-x-auto">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-primary text-primary-foreground"
                : "bg-background-card text-foreground border border-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-col gap-4 px-4 pb-6">
        {tab === "about" && <AboutTab user={user} />}
        {tab === "results" && <ResultsTab userId={user.id} />}
        {tab === "reliability" && <ReliabilityTab userId={user.id} />}
        {tab === "settings" && <SettingsTab user={user} onSave={saveProfile} />}

        <MyJoinRequests userId={user.id} />
      </div>
    </div>
  );
}

/* ─── Stat card (reusable) ─────────────────────────────────── */

function StatCard({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-background-card border border-border rounded-lg p-4 ${className}`}>
      <p className="text-xs uppercase font-display text-foreground-secondary tracking-wide mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}

/* ─── Обо мне (read-only) ──────────────────────────────────── */

function AboutTab({ user }: { user: User }) {
  const age = user.birth_date ? calcAge(user.birth_date) : null;
  const positionChips = user.position
    ? user.position.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const isEmpty = !user.bio && !user.skill_level && !user.position && !user.preferred_time && age === null;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <p className="text-foreground-secondary text-sm">Профиль ещё не заполнен</p>
        <p className="text-xs text-foreground-secondary">Перейди в Настройки, чтобы добавить информацию о себе</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pt-1">
      {user.bio && (
        <StatCard label="Био">
          <p className="text-sm leading-relaxed">{user.bio}</p>
        </StatCard>
      )}

      {(user.skill_level || age !== null) && (
        <div className="grid grid-cols-2 gap-3">
          {user.skill_level && (
            <StatCard label="Уровень">
              <p className="text-xl font-display font-bold">{user.skill_level}</p>
            </StatCard>
          )}
          {age !== null && (
            <StatCard label="Возраст">
              <p className="text-3xl font-display font-bold leading-none">
                {age}{" "}
                <span className="text-base font-sans font-normal text-foreground-secondary">лет</span>
              </p>
            </StatCard>
          )}
        </div>
      )}

      {positionChips.length > 0 && (
        <div>
          <p className="text-xs uppercase font-display text-foreground-secondary tracking-wide mb-2">
            На поле
          </p>
          <div className="flex flex-wrap gap-2">
            {positionChips.map((chip) => (
              <span
                key={chip}
                className="bg-background-card border border-border rounded-full px-4 py-1.5 text-sm font-medium"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      )}

      {user.preferred_time && (
        <StatCard label="Время тренировок">
          <p className="text-sm">{user.preferred_time}</p>
        </StatCard>
      )}
    </div>
  );
}

/* ─── Результаты ───────────────────────────────────────────── */

function ResultsTab({ userId }: { userId: string }) {
  const [stats, setStats] = useState<Stats | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${userId}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setStats(d ?? null); })
      .catch(() => { if (!cancelled) setStats(null); });
    return () => { cancelled = true; };
  }, [userId]);

  if (stats === undefined) {
    return <div className="h-40 animate-pulse bg-border rounded-lg mt-1" />;
  }

  const secondary: { label: string; value: string | number }[] = [
    { label: "Голы", value: "—" },
    { label: "Передачи", value: "—" },
    { label: "Жёлтые", value: "—" },
    { label: "MVP", value: "—" },
  ];

  return (
    <div className="flex flex-col gap-3 pt-1">
      <StatCard label="Сыгранные матчи">
        <p className="text-6xl font-display font-bold leading-none mt-1">
          {stats?.playedCount ?? 0}
        </p>
      </StatCard>

      <div className="grid grid-cols-2 gap-3">
        {secondary.map(({ label, value }) => (
          <StatCard key={label} label={label}>
            <p className="text-3xl font-display font-bold leading-none mt-1">{value}</p>
            <p className="text-xs text-foreground-secondary mt-1">скоро</p>
          </StatCard>
        ))}
      </div>
    </div>
  );
}

/* ─── Надёжность ───────────────────────────────────────────── */

function reliabilityLabel(r: number): string {
  if (r >= 90) return "Стабильный игрок";
  if (r >= 70) return "Надёжный";
  if (r >= 50) return "Средняя надёжность";
  return "Низкая надёжность";
}

function ReliabilityTab({ userId }: { userId: string }) {
  const [stats, setStats] = useState<Stats | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${userId}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setStats(d ?? null); })
      .catch(() => { if (!cancelled) setStats(null); });
    return () => { cancelled = true; };
  }, [userId]);

  if (stats === undefined) {
    return <div className="h-40 animate-pulse bg-border rounded-lg mt-1" />;
  }

  const reliability = stats?.reliability ?? null;
  const hasData = stats && stats.votedYesCount > 0;
  const missed = hasData ? stats.votedYesCount - stats.attendedCount : 0;
  const missRate =
    hasData && stats.votedYesCount > 0
      ? Math.round(((stats.votedYesCount - stats.attendedCount) / stats.votedYesCount) * 100)
      : 0;
  const attendedPct =
    hasData && stats.votedYesCount > 0
      ? Math.round((stats.attendedCount / stats.votedYesCount) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-3 pt-1">
      <StatCard label="Индекс надёжности">
        {!hasData ? (
          <p className="text-sm text-foreground-secondary">
            Появится после первых завершённых событий
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-display font-bold leading-none">
                {reliability !== null ? reliability : "—"}
                <span className="text-2xl ml-1 text-foreground-secondary">%</span>
              </p>
              {reliability !== null && (
                <p className="text-sm text-foreground-secondary mt-1">
                  {reliabilityLabel(reliability)}
                </p>
              )}
            </div>
            <div className="relative shrink-0">
              <CircularProgress value={reliability ?? 0} size={72} strokeWidth={7} />
            </div>
          </div>
        )}
      </StatCard>

      {hasData && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Неприходы">
              <p className={`text-3xl font-display font-bold leading-none mt-1 ${missed === 0 ? "text-primary" : "text-foreground"}`}>
                {missed}
              </p>
            </StatCard>
            <StatCard label="Отмены">
              <p className={`text-3xl font-display font-bold leading-none mt-1 ${missRate === 0 ? "text-primary" : "text-foreground"}`}>
                {missRate}%
              </p>
            </StatCard>
          </div>

          <StatCard label="Посещаемость">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" />
              <span className="text-sm font-medium">
                {stats.attendedCount} / {stats.votedYesCount}
              </span>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${attendedPct}%` }}
              />
            </div>
            <p className="text-xs text-foreground-secondary mt-1">{attendedPct}%</p>
          </StatCard>
        </>
      )}

      {stats && stats.recentEvents.length > 0 && (
        <div>
          <p className="text-xs uppercase font-display text-foreground-secondary tracking-wide mb-2">
            Последние события
          </p>
          <div className="bg-background-card border border-border rounded-lg divide-y divide-border">
            {stats.recentEvents.map((e) => {
              const dotColor =
                e.attended === true
                  ? "bg-primary"
                  : e.attended === false
                  ? "bg-red-500"
                  : "bg-foreground-secondary";
              const label =
                e.attended === true
                  ? e.type === "training" ? "Был на тренировке" : "Сыграл матч"
                  : e.attended === false
                  ? e.type === "training" ? "Пропустил тренировку" : "Пропустил матч"
                  : `Записался — ${EVENT_TYPE_LABEL[e.type] ?? e.type}`;
              return (
                <div key={e.event_id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className="text-xs text-foreground-secondary shrink-0 ml-3">
                    {formatRelativeDate(e.date)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Настройки ────────────────────────────────────────────── */

function SettingsTab({
  user,
  onSave,
}: {
  user: User;
  onSave: (fields: Partial<Pick<User, "bio" | "birth_date" | "position" | "skill_level" | "preferred_time" | "looking_for_team">>) => Promise<void>;
}) {
  const [bio, setBio] = useState(user.bio ?? "");
  const [position, setPosition] = useState(user.position ?? "");
  const [skillLevel, setSkillLevel] = useState(user.skill_level ?? "");
  const [preferredTime, setPreferredTime] = useState(user.preferred_time ?? "");
  const [birthDate, setBirthDate] = useState(user.birth_date ?? "");
  const [lookingForTeam, setLookingForTeam] = useState(user.looking_for_team);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await onSave({
        bio: bio.trim() || null,
        position: position.trim() || null,
        skill_level: skillLevel.trim() || null,
        preferred_time: preferredTime.trim() || null,
        birth_date: birthDate || null,
        looking_for_team: lookingForTeam,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full bg-background-card border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors";
  const labelClass = "text-xs text-foreground-secondary mb-1 block";

  return (
    <div className="flex flex-col gap-4 pt-1">
      <div>
        <label className={labelClass}>О себе</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Игровой стиль, опыт, цели…"
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className={labelClass}>Позиция (через запятую)</label>
        <input
          type="text"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          placeholder="Нападающий, Универсал…"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Уровень</label>
        <input
          type="text"
          value={skillLevel}
          onChange={(e) => setSkillLevel(e.target.value)}
          placeholder="Любитель, полупрофи…"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Время тренировок</label>
        <input
          type="text"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          placeholder="Вечер буднями, выходные…"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Дата рождения</label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Looking for team toggle */}
      <button
        type="button"
        onClick={() => setLookingForTeam((v) => !v)}
        className={`flex items-center justify-between w-full bg-background-card border rounded-lg px-4 py-3 transition-colors ${
          lookingForTeam ? "border-primary" : "border-border"
        }`}
      >
        <div className="text-left">
          <p className="text-sm font-medium">Ищу команду</p>
          <p className="text-xs text-foreground-secondary mt-0.5">
            {lookingForTeam ? "Отображаешься в каталоге игроков" : "Скрыт из каталога"}
          </p>
        </div>
        <div
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
            lookingForTeam ? "bg-primary" : "bg-border"
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              lookingForTeam ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </div>
      </button>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full py-3 transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {saving ? "Сохраняю…" : saved ? "Сохранено ✓" : "Сохранить"}
      </button>
    </div>
  );
}

/* ─── Мои заявки ───────────────────────────────────────────── */

function MyJoinRequests({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<JoinRequestItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${userId}/join-requests`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setRequests(d.requests ?? []); })
      .catch(() => { if (!cancelled) setRequests([]); });
    return () => { cancelled = true; };
  }, [userId]);

  if (requests !== null && requests.length === 0) return null;

  return (
    <div>
      <p className="text-xs uppercase font-display text-foreground-secondary tracking-wide mb-2">
        Мои заявки
      </p>
      {requests === null ? (
        <div className="h-14 animate-pulse bg-border rounded-lg" />
      ) : (
        <div className="bg-background-card border border-border rounded-lg divide-y divide-border">
          {requests.map((r) => (
            <Link key={r.id} href={`/team/${r.team.id}`} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-sm">{r.team.name}</p>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  {r.team.city} · {SPORT_LABEL[r.team.sport] ?? r.team.sport}
                </p>
              </div>
              <span className={`text-xs font-display font-semibold uppercase px-2 py-1 rounded ${STATUS_STYLE[r.status] ?? ""}`}>
                {STATUS_LABEL[r.status] ?? r.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Icons ────────────────────────────────────────────────── */

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

/* ─── Utils ────────────────────────────────────────────────── */

function calcAge(birthDate: string): number | null {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  if (
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  )
    age--;
  return age;
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
