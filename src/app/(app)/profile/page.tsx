"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { CircularProgress } from "@/components/CircularProgress";
import { Skeleton } from "@/components/Skeleton";
import Select from "@/components/Select";
import DistrictSelect from "@/components/DistrictSelect";
import { POSITIONS, SKILL_LEVELS, EVENT_TYPE_LABEL, SPORT_LABEL } from "@/lib/catalogs";
import {
  Card,
  Button,
  Pill,
  Avatar,
  IconButton,
  MiniStatCard,
  SectionEyebrow,
} from "@/components/ui";
import type { User } from "@/types/database";

type Tab = "about" | "results" | "reliability" | "settings";

const STATUS_LABEL: Record<string, string> = {
  pending: "На рассмотрении",
  accepted: "Принята",
  rejected: "Отклонена",
};
const STATUS_PILL: Record<string, "role" | "statusMuted" | "statusDanger"> = {
  pending: "role",
  accepted: "statusMuted",
  rejected: "statusDanger",
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
  const [stats, setStats] = useState<Stats | null | undefined>(undefined);
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

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/users/${initialUser.id}/stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setStats(d ?? null); })
      .catch(() => { if (!cancelled) setStats(null); });
    return () => { cancelled = true; };
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

  const locationLabel = [user.city, districtName].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero — light, no dark block */}
      <div className="bg-background-card shadow-card px-4 pt-6 pb-5 relative">
        {/* Avatar with camera button */}
        <div className="relative w-24 h-24 mx-auto">
          <Avatar size="xl" src={user.avatar_url} name={user.name} />
          <IconButton
            kind="on-photo"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Загрузить фото"
            className="absolute bottom-0 right-0 w-8 h-8 disabled:opacity-50"
          >
            {uploading ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <CameraIcon />
            )}
          </IconButton>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />

        {/* Name */}
        <h1 className="text-[28px] font-bold text-foreground text-center leading-tight mt-3">
          {user.name}
        </h1>

        {/* Location */}
        {locationLabel && (
          <p className="text-[13px] text-foreground-secondary text-center mt-1">{locationLabel}</p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-3">
          {user.looking_for_team && (
            <Pill variant="role">Ищет команду</Pill>
          )}
        </div>

        {uploadError && (
          <p className="text-[13px] text-danger text-center mt-2">{uploadError}</p>
        )}
      </div>

      {/* Tabs */}
      <nav className="px-4 py-3 bg-background">
        <div className="flex justify-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map(({ id, label }) => (
            <Pill
              key={id}
              variant={tab === id ? "filterActive" : "filter"}
              onClick={() => setTab(id)}
              className="whitespace-nowrap"
            >
              {label}
            </Pill>
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
        {tab === "results" && <ResultsTab stats={stats} />}
        {tab === "reliability" && <ReliabilityTab stats={stats} />}
        {tab === "settings" && <SettingsTab user={user} onSave={saveProfile} />}
      </div>
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
        <p className="text-foreground-secondary text-[15px]">Профиль ещё не заполнен</p>
        <p className="text-[13px] text-foreground-secondary">
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
        <Card>
          <SectionEyebrow tone="muted">Био</SectionEyebrow>
          <p className="text-[15px] leading-relaxed">{displayBio}</p>
          {isLong && (
            <button
              onClick={() => setBioExpanded((v) => !v)}
              className="text-[14px] text-primary font-semibold mt-2"
            >
              {bioExpanded ? "Скрыть" : "Ещё"}
            </button>
          )}
        </Card>
      )}

      {(user.skill_level || age !== null) && (
        <div className="grid grid-cols-2 gap-3">
          {user.skill_level && (
            <MiniStatCard label="Уровень" value={user.skill_level} />
          )}
          {age !== null && (
            <MiniStatCard label="Возраст" value={`${age} лет`} />
          )}
        </div>
      )}

      {positionChips.length > 0 && (
        <div>
          <SectionEyebrow tone="muted">На поле</SectionEyebrow>
          <div className="flex flex-wrap gap-2">
            {positionChips.map((chip) => (
              <Pill key={chip} variant="filter">{chip}</Pill>
            ))}
          </div>
        </div>
      )}

      {user.preferred_time && (
        <Card>
          <SectionEyebrow tone="muted">Время тренировок</SectionEyebrow>
          <p className="text-[15px]">{user.preferred_time}</p>
        </Card>
      )}
    </div>
  );
}

/* ─── Результаты ───────────────────────────────────────────── */

function ResultsTab({ stats }: { stats: Stats | null | undefined }) {
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
      <Card padding="lg">
        <SectionEyebrow tone="muted">Сыгранные матчи</SectionEyebrow>
        <p className="text-[40px] leading-none font-bold tabular-nums mt-1">
          {stats?.playedCount ?? 0}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {secondary.map(({ label }) => (
          <Card key={label}>
            <SectionEyebrow tone="muted">{label}</SectionEyebrow>
            <p className="text-[28px] font-semibold leading-none tabular-nums mt-1">—</p>
            <p className="text-[13px] text-foreground-secondary mt-1">скоро</p>
          </Card>
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

function ReliabilityTab({ stats }: { stats: Stats | null | undefined }) {
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
      <Card padding="lg">
        <SectionEyebrow tone="muted">Индекс надёжности</SectionEyebrow>
        {!hasData ? (
          <p className="text-[15px] text-foreground-secondary">
            Появится после первых завершённых событий
          </p>
        ) : (
          <div className="flex items-center justify-between mt-1">
            <div>
              <p className="text-[40px] leading-none font-bold tabular-nums">
                {reliability !== null ? reliability : "—"}
                <span className="text-[20px] ml-1 text-foreground-secondary">%</span>
              </p>
              {reliability !== null && (
                <p className="text-[13px] text-foreground-secondary mt-1">
                  {reliabilityLabel(reliability)}
                </p>
              )}
            </div>
            <div className="relative shrink-0">
              <CircularProgress value={reliability ?? 0} size={72} strokeWidth={7} />
            </div>
          </div>
        )}
      </Card>

      {hasData && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <MiniStatCard
              label="Неприходы"
              value={missed}
              color={missed === 0 ? "primary" : "default"}
            />
            <MiniStatCard
              label="Отмены"
              value={`${missRate}%`}
              color={missRate === 0 ? "primary" : "default"}
            />
          </div>

          <Card>
            <SectionEyebrow tone="muted">Посещаемость</SectionEyebrow>
            <div className="flex items-center justify-between mb-2">
              <span />
              <span className="text-[15px] font-medium tabular-nums">
                {stats.attendedCount} / {stats.votedYesCount}
              </span>
            </div>
            <div className="h-1.5 bg-background-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${attendedPct}%` }}
              />
            </div>
            <p className="text-[13px] text-foreground-secondary mt-1">{attendedPct}%</p>
          </Card>
        </>
      )}

      {stats && stats.recentEvents.length > 0 && (
        <div>
          <SectionEyebrow tone="muted">Последние события</SectionEyebrow>
          <Card padding="sm">
            <ul className="divide-y divide-border">
              {stats.recentEvents.map((e) => {
                const dotColor =
                  e.attended === true
                    ? "bg-primary"
                    : e.attended === false
                    ? "bg-danger"
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
                  <li key={e.event_id} className="flex items-center justify-between px-1 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                      <span className="text-[15px]">{label}</span>
                    </div>
                    <span className="text-[13px] text-foreground-secondary shrink-0 ml-3">
                      {formatRelativeDate(e.date)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
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
    "w-full bg-background-card border border-border rounded-lg px-4 py-3 text-[15px] focus:outline-none focus:border-primary transition-colors";
  const labelClass = "text-[13px] text-foreground-secondary mb-1 block";

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
          <p className="text-[15px] font-medium">Ищу команду</p>
          <p className="text-[13px] text-foreground-secondary mt-0.5">
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

      <Button
        variant={saved ? "secondary" : "primary"}
        size="lg"
        loading={saving}
        className="w-full"
        onClick={handleSave}
      >
        {saved ? "Сохранено" : "Сохранить"}
      </Button>
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
      <SectionEyebrow tone="muted">Мои заявки</SectionEyebrow>
      {requests === null ? (
        <Skeleton className="h-14" />
      ) : (
        <Card padding="sm">
          <ul className="divide-y divide-border">
            {requests.map((r) => (
              <li key={r.id} className="px-1 py-3">
                <div className="flex items-center justify-between">
                  <Link href={`/team/${r.team.id}`} className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium">{r.team.name}</p>
                    <p className="text-[13px] text-foreground-secondary mt-0.5">
                      {r.team.city} · {SPORT_LABEL[r.team.sport] ?? r.team.sport}
                    </p>
                    <p className="text-[13px] text-foreground-secondary mt-0.5">
                      {r.direction === "team_to_player"
                        ? `Тебя пригласил${r.inviter_name ? ` ${r.inviter_name}` : ""}`
                        : "Ты подал заявку"}
                    </p>
                  </Link>
                  {r.status !== "pending" && (
                    <Pill variant={STATUS_PILL[r.status] ?? "statusMuted"}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Pill>
                  )}
                </div>
                {r.direction === "team_to_player" && r.status === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="primary"
                      size="md"
                      disabled={responding === r.id}
                      loading={responding === r.id}
                      onClick={() => respond(r.id, "accept")}
                      className="flex-1 py-2 text-[13px]"
                    >
                      Принять
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      disabled={responding === r.id}
                      onClick={() => respond(r.id, "reject")}
                      className="flex-1 py-2 text-[13px]"
                    >
                      Отклонить
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

/* ─── Icons ────────────────────────────────────────────────── */

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
