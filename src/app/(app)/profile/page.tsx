"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { CircularProgress } from "@/components/CircularProgress";
import { EVENT_TYPE_LABEL, SPORT_LABEL } from "@/lib/catalogs";
import { Pill, Button } from "@/components/ui";
import {
  PageHeader,
  HeaderStatGroup,
  HeaderStat,
} from "@/components/ui/PageHeader";
import { UnderlineTabs, type UnderlineTab } from "@/components/ui/UnderlineTabs";
import { PositionChipList } from "@/components/PositionChip";
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
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("about");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null | undefined>(undefined);
  const [teamsCount, setTeamsCount] = useState<number | null>(null);
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
    fetch(`/api/users/${initialUser.id}/teams`)
      .then((r) => (r.ok ? r.json() : { teams: [] }))
      .then((d) => {
        if (!cancelled) setTeamsCount((d.teams ?? []).length);
      })
      .catch(() => {
        if (!cancelled) setTeamsCount(0);
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
    { id: "achievements", label: "Награды" },
  ];

  const subtitleLocation = [
    user.city || activeCity,
    user.city === (activeCity || user.city) ? districtName : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const tabsForUI: UnderlineTab[] = tabs.map((t) => ({
    label: t.label,
    active: tab === t.id,
    onClick: () => setTab(t.id),
  }));

  const reliabilityValue =
    stats?.reliability !== null && stats?.reliability !== undefined
      ? `${stats.reliability}%`
      : "—";

  const leadingSlot = (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Загрузить фото"
        className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
        style={{
          background: user.avatar_url ? "white" : "rgba(255,255,255,0.18)",
          border: "2px solid rgba(255,255,255,0.25)",
          opacity: uploading ? 0.5 : 1,
        }}
      >
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.name}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="font-display text-[24px] font-bold text-white leading-none">
            {(user.name || "?").trim().charAt(0).toUpperCase()}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Сменить фото"
        className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          background: "var(--green-500)",
          border: "2px solid var(--green-600)",
        }}
        disabled={uploading}
      >
        {uploading ? (
          <div className="w-2.5 h-2.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <CameraIcon />
        )}
      </button>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col" style={{ background: "var(--bg-secondary)" }}>
      <PageHeader
        title={user.name}
        subtitle={subtitleLocation || undefined}
        leadingSlot={leadingSlot}
        onSettingsClick={() => router.push("/profile/settings")}
        settingsAriaLabel="Настройки профиля"
      >
        {user.looking_for_team && (
          <div className="mb-3 -mt-1">
            <span
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold rounded-full px-3 py-1"
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "white",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "white" }}
              />
              Ищу команду
            </span>
          </div>
        )}
        <HeaderStatGroup>
          <HeaderStat value={stats?.playedCount ?? 0} label="Сыграно" />
          <HeaderStat value={reliabilityValue} label="Надёжность" />
          <HeaderStat value={teamsCount ?? 0} label="Команд" />
        </HeaderStatGroup>
      </PageHeader>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      {uploadError && (
        <p
          className="text-[13px] text-center mt-2 px-4"
          style={{ color: "var(--danger)" }}
        >
          {uploadError}
        </p>
      )}

      <UnderlineTabs
        tabs={tabsForUI}
        className="sticky top-0 z-10 bg-white"
      />

      <div className="flex flex-col gap-4 px-4 py-4 pb-6">
        {tab === "about" && <AboutTab user={user} />}
        {tab === "results" && <ResultsTab stats={stats} />}
        {tab === "reliability" && <ReliabilityTab stats={stats} />}
        {tab === "achievements" && <AchievementsTab />}

        <MyJoinRequests userId={user.id} />
      </div>
    </div>
  );
}

/* ─── Обо мне ──────────────────────────────────────────────── */

function AboutTab({ user }: { user: User }) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const age = user.birth_date ? calcAge(user.birth_date) : null;
  const positionChips = user.position ?? [];
  const isEmpty =
    !user.bio &&
    !user.skill_level &&
    positionChips.length === 0 &&
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
          <div className="mt-2">
            <PositionChipList positions={positionChips} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Результаты ───────────────────────────────────────────── */

function ResultsTab({ stats }: { stats: Stats | null | undefined }) {
  if (stats === undefined) return <SkeletonBlock />;

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

      <div
        className="rounded-[16px] p-5"
        style={{ background: "var(--bg-primary)" }}
      >
        <p
          className="text-[15px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          🏗 Игровая статистика — в разработке
        </p>
        <p
          className="text-[13px] mt-1.5 leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Скоро ты сможешь видеть свои голы, передачи, MVP-награды и другие
          показатели за каждый матч.
        </p>
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

  // recentEvents already comes sorted DESC from /api/users/[id]/stats (events(date) desc)

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
              const statusLabel =
                e.attended === true
                  ? "Был"
                  : e.attended === false
                    ? "Не был"
                    : "Не голосовал";
              const typeLabel = EVENT_TYPE_LABEL[e.type] ?? e.type;
              return (
                <li
                  key={e.event_id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                  style={{
                    borderTop:
                      i === 0 ? undefined : "1px solid var(--gray-100)",
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: dotColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-[15px] truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatAbsoluteDate(e.date)} · {typeLabel}
                      </p>
                    </div>
                  </div>
                  <span
                    className="text-[13px] font-semibold shrink-0"
                    style={{
                      color:
                        e.attended === true
                          ? "var(--green-600)"
                          : e.attended === false
                            ? "var(--danger)"
                            : "var(--text-tertiary)",
                    }}
                  >
                    {statusLabel}
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
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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

function formatAbsoluteDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
