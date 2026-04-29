"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { CircularProgress } from "@/components/CircularProgress";
import { EVENT_TYPE_LABEL, SPORT_LABEL } from "@/lib/catalogs";
import { Avatar, IconButton, Pill, Button } from "@/components/ui";
import { CitySheet } from "@/components/CitySheet";
import { useCity } from "@/lib/city-context";
import type { User } from "@/types/database";

type Tab = "about" | "results" | "reliability" | "achievements";

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
  created_at: string;
  resolved_at: string | null;
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
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--green-500)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }
  if (auth.status !== "authenticated") return null;

  return <ProfileContent initialUser={auth.user} />;
}

/* ─── Shell ────────────────────────────────────────────────── */

function ProfileContent({ initialUser }: { initialUser: User }) {
  const [user, setUser] = useState(initialUser);
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("about");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null | undefined>(undefined);
  const [citySheetOpen, setCitySheetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeCity } = useCity();

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
      .then((d) => {
        if (!cancelled) setStats(d ?? null);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
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
      const res = await fetch(`/api/users/${user.id}/avatar`, {
        method: "POST",
        body: fd,
      });
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "about", label: "Обо мне" },
    { id: "results", label: "Результаты" },
    { id: "reliability", label: "Надёжность" },
    { id: "achievements", label: "Достижения" },
  ];

  const locationLabel = [activeCity, activeCity === user.city ? districtName : null].filter(Boolean).join(" · ");

  return (
    <div
      className="flex flex-1 flex-col"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Hero */}
      <div className="relative pt-6 pb-5 px-4" style={{ background: "var(--bg-primary)" }}>
        <Link
          href="/profile/settings"
          aria-label="Настройки"
          className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-secondary)",
            border: "1px solid var(--gray-200)",
          }}
        >
          <SettingsIcon />
        </Link>

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

        <h1
          className="text-[28px] font-bold text-center leading-tight mt-3"
          style={{ color: "var(--text-primary)" }}
        >
          {user.name}
        </h1>

        <button
          type="button"
          onClick={() => setCitySheetOpen(true)}
          className="flex items-center justify-center gap-1.5 mt-2 mx-auto active:opacity-60 transition-opacity"
        >
          <MapPinIcon />
          <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            {locationLabel || "Город не выбран"}
          </span>
          <PencilIcon />
        </button>

        {user.looking_for_team && (
          <div className="flex justify-center mt-3">
            <span
              className="text-[12px] font-semibold rounded-full px-3 py-1"
              style={{
                background: "var(--green-50)",
                color: "var(--green-700)",
              }}
            >
              Ищет команду
            </span>
          </div>
        )}

        {uploadError && (
          <p
            className="text-[13px] text-center mt-2"
            style={{ color: "var(--danger)" }}
          >
            {uploadError}
          </p>
        )}
      </div>

      {/* UnderlineTabs (state-based) */}
      <nav
        className="flex sticky top-0 z-10"
        style={{
          background: "var(--bg-primary)",
          borderBottom: "1px solid var(--gray-100)",
        }}
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="relative flex-1 text-center pt-2 pb-2.5 text-[14px] transition-colors whitespace-nowrap"
              style={{
                color: active ? "var(--green-700)" : "var(--text-secondary)",
                fontWeight: active ? 700 : 500,
              }}
            >
              {t.label}
              {active && (
                <span
                  className="absolute left-1/2 -translate-x-1/2 bottom-0 h-[2.5px] rounded-full"
                  style={{
                    background: "var(--green-500)",
                    width: "calc(100% - 16px)",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Tab content */}
      <div className="flex flex-col gap-4 px-4 py-4 pb-6">
        {tab === "about" && <AboutTab user={user} />}
        {tab === "results" && <ResultsTab stats={stats} />}
        {tab === "reliability" && <ReliabilityTab stats={stats} />}
        {tab === "achievements" && <AchievementsTab />}

        <MyJoinRequests userId={user.id} />
      </div>

      {citySheetOpen && <CitySheet onClose={() => setCitySheetOpen(false)} />}
    </div>
  );
}

/* ─── Обо мне ──────────────────────────────────────────────── */

function AboutTab({ user }: { user: User }) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const age = user.birth_date ? calcAge(user.birth_date) : null;
  const positionChips = user.position
    ? user.position
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const isEmpty =
    !user.bio &&
    !user.skill_level &&
    !user.position &&
    !user.preferred_time &&
    age === null;

  if (isEmpty) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center rounded-[16px] p-8"
        style={{ background: "var(--bg-primary)" }}
      >
        <p className="text-[15px]" style={{ color: "var(--text-secondary)" }}>
          Профиль ещё не заполнен
        </p>
        <Link
          href="/profile/settings"
          className="text-[14px] font-semibold mt-3"
          style={{ color: "var(--green-600)" }}
        >
          Заполнить профиль →
        </Link>
      </div>
    );
  }

  const isLong = (user.bio?.length ?? 0) > 120;
  const displayBio =
    !bioExpanded && isLong ? user.bio!.slice(0, 120) + "…" : user.bio;

  return (
    <div className="flex flex-col gap-3">
      {user.bio && (
        <div
          className="rounded-[16px] p-4"
          style={{ background: "var(--bg-primary)" }}
        >
          <Eyebrow>Био</Eyebrow>
          <p
            className="text-[15px] leading-relaxed mt-2"
            style={{ color: "var(--text-primary)" }}
          >
            {displayBio}
          </p>
          {isLong && (
            <button
              type="button"
              onClick={() => setBioExpanded((v) => !v)}
              className="text-[14px] font-semibold mt-2"
              style={{ color: "var(--green-600)" }}
            >
              {bioExpanded ? "Скрыть" : "Ещё"}
            </button>
          )}
        </div>
      )}

      {(user.skill_level || age !== null) && (
        <div className="grid grid-cols-2 gap-3">
          {user.skill_level && (
            <StatTile label="Уровень" value={user.skill_level} />
          )}
          {age !== null && <StatTile label="Возраст" value={`${age} лет`} />}
        </div>
      )}

      {positionChips.length > 0 && (
        <div
          className="rounded-[16px] p-4"
          style={{ background: "var(--bg-primary)" }}
        >
          <Eyebrow>На поле</Eyebrow>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {positionChips.map((chip) => (
              <span
                key={chip}
                className="text-[13px] font-semibold rounded-full px-3 py-1.5"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--gray-200)",
                }}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      )}

      {user.preferred_time && (
        <div
          className="rounded-[16px] p-4"
          style={{ background: "var(--bg-primary)" }}
        >
          <Eyebrow>Время тренировок</Eyebrow>
          <p
            className="text-[15px] mt-2"
            style={{ color: "var(--text-primary)" }}
          >
            {user.preferred_time}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Результаты ───────────────────────────────────────────── */

function ResultsTab({ stats }: { stats: Stats | null | undefined }) {
  if (stats === undefined) return <SkeletonBlock />;

  const secondary = [
    { label: "Голы" },
    { label: "Передачи" },
    { label: "Жёлтые" },
    { label: "MVP" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-[16px] p-5"
        style={{ background: "var(--bg-primary)" }}
      >
        <Eyebrow>Сыграно матчей</Eyebrow>
        <p
          className="font-display text-[40px] leading-none font-bold tabular-nums mt-2"
          style={{ color: "var(--text-primary)" }}
        >
          {stats?.playedCount ?? 0}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {secondary.map(({ label }) => (
          <div
            key={label}
            className="rounded-[16px] p-4"
            style={{ background: "var(--bg-primary)" }}
          >
            <Eyebrow>{label}</Eyebrow>
            <p
              className="font-display text-[28px] font-bold leading-none tabular-nums mt-2"
              style={{ color: "var(--text-tertiary)" }}
            >
              —
            </p>
            <p
              className="text-[12px] mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              скоро
            </p>
          </div>
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
  if (stats === undefined) return <SkeletonBlock />;

  const reliability = stats?.reliability ?? null;
  const hasData = !!stats && stats.votedYesCount > 0;
  const missed = hasData ? stats!.votedYesCount - stats!.attendedCount : 0;
  const missRate =
    hasData && stats!.votedYesCount > 0
      ? Math.round(
          ((stats!.votedYesCount - stats!.attendedCount) /
            stats!.votedYesCount) *
            100,
        )
      : 0;
  const attendedPct =
    hasData && stats!.votedYesCount > 0
      ? Math.round((stats!.attendedCount / stats!.votedYesCount) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-[16px] p-5"
        style={{ background: "var(--bg-primary)" }}
      >
        <Eyebrow>Индекс надёжности</Eyebrow>
        {!hasData ? (
          <p
            className="text-[15px] mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Появится после первых завершённых событий
          </p>
        ) : (
          <div className="flex items-center justify-between mt-2">
            <div>
              <p
                className="font-display text-[40px] leading-none font-bold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {reliability !== null ? reliability : "—"}
                <span
                  className="text-[20px] ml-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  %
                </span>
              </p>
              {reliability !== null && (
                <p
                  className="text-[13px] mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {reliabilityLabel(reliability)}
                </p>
              )}
            </div>
            <div className="shrink-0">
              <CircularProgress
                value={reliability ?? 0}
                size={72}
                strokeWidth={7}
              />
            </div>
          </div>
        )}
      </div>

      {hasData && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Неприходы"
              value={missed}
              tone={missed === 0 ? "good" : "default"}
            />
            <StatTile
              label="Отмены"
              value={`${missRate}%`}
              tone={missRate === 0 ? "good" : "default"}
            />
          </div>

          <div
            className="rounded-[16px] p-4"
            style={{ background: "var(--bg-primary)" }}
          >
            <Eyebrow>Посещаемость</Eyebrow>
            <div className="flex items-center justify-between mt-2 mb-2">
              <span
                className="text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                из записанных событий
              </span>
              <span
                className="text-[15px] font-semibold tabular-nums"
                style={{ color: "var(--text-primary)" }}
              >
                {stats!.attendedCount} / {stats!.votedYesCount}
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--bg-card)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${attendedPct}%`,
                  background: "var(--green-500)",
                }}
              />
            </div>
            <p
              className="text-[13px] mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {attendedPct}%
            </p>
          </div>
        </>
      )}

      {stats && stats.recentEvents.length > 0 && (
        <div>
          <Eyebrow>Последние события</Eyebrow>
          <ul
            className="mt-2 rounded-[16px] overflow-hidden"
            style={{ background: "var(--bg-primary)" }}
          >
            {stats.recentEvents.map((e, i) => {
              const dotColor =
                e.attended === true
                  ? "var(--green-500)"
                  : e.attended === false
                    ? "var(--danger)"
                    : "var(--text-tertiary)";
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
                <li
                  key={e.event_id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    borderTop:
                      i === 0 ? undefined : "1px solid var(--gray-100)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: dotColor }}
                    />
                    <span
                      className="text-[15px]"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {label}
                    </span>
                  </div>
                  <span
                    className="text-[13px] shrink-0 ml-3"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {formatRelativeDate(e.date)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Достижения ───────────────────────────────────────────── */

function AchievementsTab() {
  const placeholders = [
    { id: "first", label: "Первый матч", emoji: "🏅" },
    { id: "streak", label: "5 матчей подряд", emoji: "🔥" },
    { id: "captain", label: "Капитан", emoji: "🎖" },
    { id: "mvp", label: "MVP события", emoji: "⭐" },
    { id: "punctual", label: "100% явка", emoji: "✅" },
    { id: "veteran", label: "50 матчей", emoji: "🏆" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-[16px] p-5 text-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <p
          className="text-[15px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Достижения копятся с каждым матчем
        </p>
        <p
          className="text-[13px] mt-1"
          style={{ color: "var(--text-secondary)" }}
        >
          Скоро появятся первые значки за активность и стабильность
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {placeholders.map((p) => (
          <div
            key={p.id}
            className="rounded-[16px] p-3 flex flex-col items-center text-center"
            style={{ background: "var(--bg-primary)" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[20px] grayscale opacity-40"
              style={{ background: "var(--bg-card)" }}
            >
              {p.emoji}
            </div>
            <p
              className="text-[11px] font-semibold mt-2 leading-tight"
              style={{ color: "var(--text-tertiary)" }}
            >
              {p.label}
            </p>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: "var(--text-tertiary)" }}
            >
              скоро
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Мои заявки ───────────────────────────────────────────── */

const HISTORY_DAYS = 30;

function MyJoinRequests({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<JoinRequestItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

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
    if (busy) return;
    setBusy(requestId);
    try {
      await fetch(`/api/join-requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, decision }),
      });
      load();
    } finally {
      setBusy(null);
    }
  }

  async function withdraw(requestId: string) {
    if (busy) return;
    setBusy(requestId);
    try {
      await fetch(`/api/join-requests/${requestId}?userId=${userId}`, {
        method: "DELETE",
      });
      load();
    } finally {
      setBusy(null);
    }
  }

  if (requests === null) return null;

  const invitations = requests.filter(
    (r) => r.direction === "team_to_player" && r.status === "pending",
  );
  const myApplications = requests.filter(
    (r) => r.direction === "player_to_team" && r.status === "pending",
  );

  const historyCutoff = Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000;
  const history = requests.filter((r) => {
    if (r.status === "pending") return false;
    const t = r.resolved_at
      ? new Date(r.resolved_at).getTime()
      : new Date(r.created_at).getTime();
    return t >= historyCutoff;
  });

  if (invitations.length === 0 && myApplications.length === 0 && history.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {invitations.length > 0 && (
        <RequestsList eyebrow={`Меня пригласили · ${invitations.length}`}>
          {invitations.map((r) => (
            <RequestItemBase key={r.id} item={r}>
              <p
                className="text-[13px] mt-0.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                Пригласил
                {r.inviter_name ? ` ${r.inviter_name}` : ""} ·{" "}
                {formatRelative(r.created_at)}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="primary"
                  size="md"
                  disabled={busy === r.id}
                  loading={busy === r.id}
                  onClick={() => respond(r.id, "accept")}
                  className="flex-1"
                >
                  Принять
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  disabled={busy === r.id}
                  onClick={() => respond(r.id, "reject")}
                  className="flex-1"
                >
                  Отклонить
                </Button>
              </div>
            </RequestItemBase>
          ))}
        </RequestsList>
      )}

      {myApplications.length > 0 && (
        <RequestsList eyebrow={`Мои заявки в команды · ${myApplications.length}`}>
          {myApplications.map((r) => (
            <RequestItemBase key={r.id} item={r}>
              <div className="flex items-center justify-between mt-1">
                <span
                  className="text-[12px] font-semibold rounded-full px-2 py-0.5"
                  style={{
                    background: "var(--green-50)",
                    color: "var(--green-700)",
                  }}
                >
                  На рассмотрении
                </span>
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => withdraw(r.id)}
                  className="text-[13px] font-semibold disabled:opacity-50"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {busy === r.id ? "…" : "Отозвать"}
                </button>
              </div>
              <p
                className="text-[12px] mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                Подана {formatRelative(r.created_at)}
              </p>
            </RequestItemBase>
          ))}
        </RequestsList>
      )}

      {history.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[12px] font-semibold uppercase"
            style={{
              letterSpacing: "0.06em",
              color: "var(--text-tertiary)",
            }}
          >
            {historyOpen ? "Скрыть историю" : `Показать историю · ${history.length}`}
            <ChevronIcon open={historyOpen} />
          </button>
          {historyOpen && (
            <ul
              className="mt-2 rounded-[16px] overflow-hidden"
              style={{ background: "var(--bg-primary)" }}
            >
              {history.map((r, i) => (
                <li
                  key={r.id}
                  className="px-4 py-3"
                  style={{
                    borderTop: i === 0 ? undefined : "1px solid var(--gray-100)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/team/${r.team.id}`} className="flex-1 min-w-0">
                      <p
                        className="text-[15px] font-semibold truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {r.team.name}
                      </p>
                      <p
                        className="text-[12px] mt-0.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {r.direction === "team_to_player"
                          ? "Приглашение"
                          : "Моя заявка"}{" "}
                        ·{" "}
                        {r.resolved_at
                          ? formatRelative(r.resolved_at)
                          : formatRelative(r.created_at)}
                      </p>
                    </Link>
                    <Pill variant={STATUS_PILL[r.status] ?? "statusMuted"}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Pill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function RequestsList({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <ul
        className="mt-2 rounded-[16px] overflow-hidden flex flex-col"
        style={{ background: "var(--bg-primary)" }}
      >
        {Array.isArray(children)
          ? children.map((c, i) => (
              <li
                key={i}
                className="px-4 py-3"
                style={{
                  borderTop: i === 0 ? undefined : "1px solid var(--gray-100)",
                }}
              >
                {c}
              </li>
            ))
          : <li className="px-4 py-3">{children}</li>}
      </ul>
    </div>
  );
}

function RequestItemBase({
  item,
  children,
}: {
  item: JoinRequestItem;
  children: React.ReactNode;
}) {
  return (
    <>
      <Link href={`/team/${item.team.id}`} className="block min-w-0">
        <p
          className="text-[15px] font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {item.team.name}
        </p>
        <p
          className="text-[13px] mt-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          {item.team.city} · {SPORT_LABEL[item.team.sport] ?? item.team.sport}
        </p>
      </Link>
      {children}
    </>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "сегодня";
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? "rotate(180deg)" : "none",
        transition: "transform 150ms",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ─── Atoms ────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-bold uppercase"
      style={{
        letterSpacing: "0.06em",
        color: "var(--text-tertiary)",
      }}
    >
      {children}
    </p>
  );
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "good";
}) {
  const valueColor =
    tone === "good" ? "var(--green-600)" : "var(--text-primary)";
  return (
    <div
      className="rounded-[16px] p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <Eyebrow>{label}</Eyebrow>
      <p
        className="font-display text-[28px] leading-none font-bold tabular-nums mt-2"
        style={{ color: valueColor }}
      >
        {value}
      </p>
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div
      className="rounded-[16px] h-32 animate-pulse"
      style={{ background: "var(--bg-card)" }}
    />
  );
}

/* ─── Icons ────────────────────────────────────────────────── */

function CameraIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)", flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)", flexShrink: 0 }}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
