"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { CircularProgress } from "@/components/CircularProgress";
import { Skeleton } from "@/components/Skeleton";
import Select from "@/components/Select";
import DistrictSelect from "@/components/DistrictSelect";
import { POSITIONS, SKILL_LEVELS } from "@/lib/catalogs";
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
  direction: "player_to_team" | "team_to_player";
  inviter_name: string | null;
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
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("about");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/users/${initialUser.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          setDistrictName(d.user.district?.name ?? null);
        }
      })
      .catch(() => {});
  }, [initialUser.id]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Файл слишком большой. Максимум 2 МБ");
      e.target.value = "";
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/users/${user.id}/avatar`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
      } else {
        setUploadError(data.error ?? "Ошибка загрузки");
      }
    } catch {
      setUploadError("Ошибка сети");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function saveProfile(
    fields: Partial<Pick<User, "bio" | "birth_date" | "position" | "skill_level" | "preferred_time" | "looking_for_team" | "district_id">>
  ) {
    const res = await fetch(`/api/users/${user.id}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      if ("district_id" in fields) {
        setDistrictName(data.user.district?.name ?? null);
      }
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
      {/* Hero — full-width cover photo */}
      <div className="relative h-72 bg-background-dark overflow-hidden">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-display font-bold text-foreground-on-dark-muted/40 select-none">
              {initials}
            </span>
          </div>
        )}

        {/* gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-background-dark via-background-dark/30 to-transparent" />

        {/* camera button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm disabled:opacity-50"
          aria-label="Загрузить фото"
        >
          {uploading ? (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <CameraIcon />
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />

        {/* name + badges at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 text-foreground-on-dark">
          {uploadError && (
            <p className="text-xs text-red-400 mb-2">{uploadError}</p>
          )}
          <h1 className="text-3xl font-display font-bold uppercase leading-none">
            {user.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {user.position && (
              <span className="flex items-center gap-1 text-xs text-foreground-on-dark-muted bg-background-dark-elevated rounded-full px-3 py-1">
                <PositionIcon /> {user.position.split(",")[0].trim()}
              </span>
            )}
            {user.city && (
              <span className="flex items-center gap-1 text-xs text-foreground-on-dark-muted bg-background-dark-elevated rounded-full px-3 py-1">
                <LocationIcon /> {user.city}{districtName ? ` · ${districtName}` : ""}
              </span>
            )}
            {user.looking_for_team && (
              <span className="flex items-center gap-1 text-xs bg-primary text-primary-foreground rounded-full px-3 py-1 font-medium">
                <SearchIcon /> Ищет команду
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs — same pattern as team layout */}
      <nav className="px-4 py-3 bg-background">
        <div className="flex justify-center gap-1.5">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                tab === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background-card text-foreground border border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab content */}
      <div className="flex flex-col gap-4 px-4 pb-6">
        {tab === "about" && (
          <>
            <AboutTab user={user} />
            <MyJoinRequests userId={user.id} />
          </>
        )}
        {tab === "results" && <ResultsTab userId={user.id} />}
        {tab === "reliability" && <ReliabilityTab userId={user.id} />}
        {tab === "settings" && <SettingsTab user={user} onSave={saveProfile} />}
      </div>
    </div>
  );
}

/* ─── Stat card ─────────────────────────────────────────────── */

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
  const [bioExpanded, setBioExpanded] = useState(false);
  const age = user.birth_date ? calcAge(user.birth_date) : null;
  const positionChips = user.position
    ? user.position.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const isEmpty =
    !user.bio && !user.skill_level && !user.position && !user.preferred_time && age === null;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-foreground-secondary text-sm">Профиль ещё не заполнен</p>
        <p className="text-xs text-foreground-secondary">
          Перейди в Настройки, чтобы добавить информацию о себе
        </p>
      </div>
    );
  }

  const isLong = (user.bio?.length ?? 0) > 120;
  const displayBio =
    !bioExpanded && isLong ? user.bio!.slice(0, 120) + "…" : user.bio;

  return (
    <div className="flex flex-col gap-3 pt-1">
      {user.bio && (
        <StatCard label="Био">
          <p className="text-sm leading-relaxed">{displayBio}</p>
          {isLong && (
            <button
              onClick={() => setBioExpanded((v) => !v)}
              className="text-sm text-primary font-medium mt-1"
            >
              {bioExpanded ? "Скрыть ↑" : "Ещё ↓"}
            </button>
          )}
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
                <span className="text-base font-sans font-normal text-foreground-secondary">
                  лет
                </span>
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
      .then((d) => {
        if (!cancelled) setStats(d ?? null);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (stats === undefined) {
    return <Skeleton className="h-40 mt-1" />;
  }

  const secondary: { label: string }[] = [
    { label: "Голы" },
    { label: "Передачи" },
    { label: "Жёлтые" },
    { label: "MVP" },
  ];

  return (
    <div className="flex flex-col gap-3 pt-1">
      <StatCard label="Сыгранные матчи">
        <p className="text-6xl font-display font-bold leading-none mt-1">
          {stats?.playedCount ?? 0}
        </p>
      </StatCard>

      <div className="grid grid-cols-2 gap-3">
        {secondary.map(({ label }) => (
          <StatCard key={label} label={label}>
            <p className="text-3xl font-display font-bold leading-none mt-1">—</p>
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
      .then((d) => {
        if (!cancelled) setStats(d ?? null);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (stats === undefined) {
    return <Skeleton className="h-40 mt-1" />;
  }

  const reliability = stats?.reliability ?? null;
  const hasData = stats && stats.votedYesCount > 0;
  const missed = hasData ? stats.votedYesCount - stats.attendedCount : 0;
  const missRate =
    hasData && stats.votedYesCount > 0
      ? Math.round(
          ((stats.votedYesCount - stats.attendedCount) / stats.votedYesCount) * 100
        )
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
              <p
                className={`text-3xl font-display font-bold leading-none mt-1 ${
                  missed === 0 ? "text-primary" : "text-foreground"
                }`}
              >
                {missed}
              </p>
            </StatCard>
            <StatCard label="Отмены">
              <p
                className={`text-3xl font-display font-bold leading-none mt-1 ${
                  missRate === 0 ? "text-primary" : "text-foreground"
                }`}
              >
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
                  ? e.type === "training"
                    ? "Был на тренировке"
                    : "Сыграл матч"
                  : e.attended === false
                  ? e.type === "training"
                    ? "Пропустил тренировку"
                    : "Пропустил матч"
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
  onSave: (
    fields: Partial<
      Pick<
        User,
        "bio" | "birth_date" | "position" | "skill_level" | "preferred_time" | "looking_for_team" | "district_id"
      >
    >
  ) => Promise<void>;
}) {
  const [bio, setBio] = useState(user.bio ?? "");
  const [position, setPosition] = useState(user.position ?? "");
  const [skillLevel, setSkillLevel] = useState(user.skill_level ?? "");
  const [preferredTime, setPreferredTime] = useState(user.preferred_time ?? "");
  const [birthDate, setBirthDate] = useState(user.birth_date ?? "");
  const [districtId, setDistrictId] = useState(user.district_id ?? "");
  const [lookingForTeam, setLookingForTeam] = useState(user.looking_for_team);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await onSave({
        bio: bio.trim() || null,
        position: position || null,
        skill_level: skillLevel || null,
        preferred_time: preferredTime.trim() || null,
        birth_date: birthDate || null,
        district_id: districtId || null,
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
        <label className={labelClass}>Позиция</label>
        <Select
          value={position}
          onChange={setPosition}
          options={POSITIONS["football"]}
          placeholder="Не выбрана"
        />
      </div>

      <div>
        <label className={labelClass}>Уровень</label>
        <Select
          value={skillLevel}
          onChange={setSkillLevel}
          options={SKILL_LEVELS}
          placeholder="Не выбран"
        />
      </div>

      {user.city && (
        <div>
          <label className={labelClass}>Район</label>
          <DistrictSelect
            city={user.city}
            value={districtId}
            onChange={setDistrictId}
            className={inputClass}
          />
        </div>
      )}

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
  const [responding, setResponding] = useState<string | null>(null);

  function load() {
    fetch(`/api/users/${userId}/join-requests`)
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .catch(() => setRequests([]));
  }

  useEffect(() => {
    load();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function respond(requestId: string, decision: "accept" | "reject") {
    if (responding) return;
    setResponding(requestId);
    try {
      await fetch(`/api/join-requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, decision }),
      });
      load();
    } finally {
      setResponding(null);
    }
  }

  if (requests !== null && requests.length === 0) return null;

  return (
    <div>
      <p className="text-xs uppercase font-display text-foreground-secondary tracking-wide mb-2">
        Мои заявки
      </p>
      {requests === null ? (
        <Skeleton className="h-14" />
      ) : (
        <div className="bg-background-card border border-border rounded-lg divide-y divide-border">
          {requests.map((r) => (
            <div key={r.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <Link href={`/team/${r.team.id}`} className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{r.team.name}</p>
                  <p className="text-xs text-foreground-secondary mt-0.5">
                    {r.team.city} · {SPORT_LABEL[r.team.sport] ?? r.team.sport}
                  </p>
                  <p className="text-xs text-foreground-secondary mt-0.5">
                    {r.direction === "team_to_player"
                      ? `Тебя пригласил${r.inviter_name ? ` ${r.inviter_name}` : ""}`
                      : "Ты подал заявку"}
                  </p>
                </Link>
                {r.status !== "pending" && (
                  <span
                    className={`text-xs font-display font-semibold uppercase px-2 py-1 rounded ${STATUS_STYLE[r.status] ?? ""}`}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                )}
              </div>
              {r.direction === "team_to_player" && r.status === "pending" && (
                <div className="flex gap-2 mt-2">
                  <button
                    disabled={responding === r.id}
                    onClick={() => respond(r.id, "accept")}
                    className="flex-1 bg-primary text-primary-foreground rounded-lg py-1.5 text-xs font-medium disabled:opacity-50"
                  >
                    Принять
                  </button>
                  <button
                    disabled={responding === r.id}
                    onClick={() => respond(r.id, "reject")}
                    className="flex-1 bg-background border border-border rounded-lg py-1.5 text-xs font-medium disabled:opacity-50"
                  >
                    Отклонить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Icons ────────────────────────────────────────────────── */

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PositionIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
