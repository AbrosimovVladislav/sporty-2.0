"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { CircularProgress } from "@/components/CircularProgress";
import type { User } from "@/types/database";

type Tab = "about" | "results" | "reliability";

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
  const [savingField, setSavingField] = useState<string | null>(null);

  async function saveField(field: string, value: unknown) {
    setSavingField(field);
    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } finally {
      setSavingField(null);
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "about", label: "Обо мне" },
    { id: "results", label: "Результаты" },
    { id: "reliability", label: "Надёжность" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero header */}
      <div className="bg-background-dark text-foreground-on-dark px-5 pt-10 pb-5">
        <h1 className="text-4xl font-display font-bold uppercase leading-none">{user.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {user.position && (
            <span className="flex items-center gap-1 text-xs text-foreground-on-dark-muted bg-background-dark-elevated rounded-full px-3 py-1">
              <span className="opacity-60">◎</span> {user.position.split(",")[0].trim()}
            </span>
          )}
          {user.city && (
            <span className="flex items-center gap-1 text-xs text-foreground-on-dark-muted bg-background-dark-elevated rounded-full px-3 py-1">
              <span className="opacity-60">⊙</span> {user.city}
            </span>
          )}
          <button
            onClick={() => saveField("looking_for_team", !user.looking_for_team)}
            disabled={savingField === "looking_for_team"}
            className={`flex items-center gap-1 text-xs rounded-full px-3 py-1 font-medium transition-colors disabled:opacity-50 ${
              user.looking_for_team
                ? "bg-primary text-primary-foreground"
                : "bg-background-dark-elevated text-foreground-on-dark-muted"
            }`}
          >
            <span className="opacity-80">⚑</span>
            {user.looking_for_team ? "Ищет команду" : "Не ищет команду"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 bg-background overflow-x-auto">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
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
        {tab === "about" && (
          <AboutTab user={user} savingField={savingField} onSave={saveField} />
        )}
        {tab === "results" && <ResultsTab userId={user.id} />}
        {tab === "reliability" && <ReliabilityTab userId={user.id} />}

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

/* ─── Обо мне ─────────────────────────────────────────────── */

function AboutTab({
  user,
  savingField,
  onSave,
}: {
  user: User;
  savingField: string | null;
  onSave: (field: string, value: unknown) => Promise<void>;
}) {
  const age = user.birth_date ? calcAge(user.birth_date) : null;
  const positionChips = user.position
    ? user.position.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex flex-col gap-3 pt-1">
      <BioField value={user.bio} saving={savingField === "bio"} onSave={onSave} />

      {(user.skill_level || age !== null) && (
        <div className="grid grid-cols-2 gap-3">
          {user.skill_level && (
            <StatCard label="Уровень">
              <InlineField
                fieldKey="skill_level"
                value={user.skill_level}
                placeholder="Любитель…"
                saving={savingField === "skill_level"}
                onSave={onSave}
                renderValue={(v) => (
                  <p className="text-xl font-display font-bold">{v}</p>
                )}
              />
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

      {/* Editable fields without values */}
      <div className="flex flex-col gap-2">
        {!user.skill_level && (
          <InlineFieldRow
            label="Уровень"
            fieldKey="skill_level"
            value={user.skill_level}
            placeholder="Любитель, полупрофи…"
            saving={savingField === "skill_level"}
            onSave={onSave}
          />
        )}
        <InlineFieldRow
          label="Позиция (через запятую)"
          fieldKey="position"
          value={user.position}
          placeholder="Нападающий, Универсал, Левая нога"
          saving={savingField === "position"}
          onSave={onSave}
        />
        <InlineFieldRow
          label="Время тренировок"
          fieldKey="preferred_time"
          value={user.preferred_time}
          placeholder="Вечер буднями, выходные…"
          saving={savingField === "preferred_time"}
          onSave={onSave}
        />
        <InlineFieldRow
          label="Дата рождения"
          fieldKey="birth_date"
          value={user.birth_date}
          placeholder="ГГГГ-ММ-ДД"
          inputType="date"
          saving={savingField === "birth_date"}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

function BioField({
  value,
  saving,
  onSave,
}: {
  value: string | null;
  saving: boolean;
  onSave: (field: string, value: unknown) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  async function commit() {
    setEditing(false);
    const next = draft.trim() || null;
    if (next !== value) await onSave("bio", next);
  }

  const placeholder = "Расскажи о себе: игровой стиль, опыт…";
  const isLong = (value?.length ?? 0) > 120;
  const displayText = !expanded && isLong ? value!.slice(0, 120) + "…" : value;

  return (
    <StatCard label="Био">
      {editing ? (
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          placeholder={placeholder}
          rows={4}
          className="w-full text-sm bg-transparent focus:outline-none resize-none"
        />
      ) : saving ? (
        <p className="text-sm text-foreground-secondary">Сохраняю…</p>
      ) : value ? (
        <div>
          <p className="text-sm leading-relaxed cursor-pointer" onClick={() => setEditing(true)}>
            {displayText}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-sm text-primary font-medium mt-1"
            >
              {expanded ? "Скрыть ↑" : "Ещё ↓"}
            </button>
          )}
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="text-sm text-foreground-secondary">
          {placeholder}
        </button>
      )}
    </StatCard>
  );
}

function InlineField({
  fieldKey,
  value,
  placeholder,
  inputType = "text",
  saving,
  onSave,
  renderValue,
}: {
  fieldKey: string;
  value: string | null;
  placeholder: string;
  inputType?: string;
  saving: boolean;
  onSave: (field: string, value: unknown) => Promise<void>;
  renderValue?: (v: string) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  async function commit() {
    setEditing(false);
    const next = draft.trim() || null;
    if (next !== value) await onSave(fieldKey, next);
  }

  if (editing) {
    return (
      <input
        ref={ref}
        type={inputType}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        placeholder={placeholder}
        className="w-full text-sm bg-transparent focus:outline-none"
      />
    );
  }
  if (saving) return <p className="text-sm text-foreground-secondary">Сохраняю…</p>;

  return (
    <div onClick={() => setEditing(true)} className="cursor-pointer">
      {value
        ? renderValue ? renderValue(value) : <p className="text-sm">{value}</p>
        : <p className="text-sm text-foreground-secondary">{placeholder}</p>}
    </div>
  );
}

function InlineFieldRow({
  label,
  fieldKey,
  value,
  placeholder,
  inputType = "text",
  saving,
  onSave,
}: {
  label: string;
  fieldKey: string;
  value: string | null;
  placeholder: string;
  inputType?: string;
  saving: boolean;
  onSave: (field: string, value: unknown) => Promise<void>;
}) {
  return (
    <div className="bg-background-card border border-border rounded-lg px-4 py-3">
      <p className="text-xs text-foreground-secondary mb-1">{label}</p>
      <InlineField
        fieldKey={fieldKey}
        value={value}
        placeholder={placeholder}
        inputType={inputType}
        saving={saving}
        onSave={onSave}
      />
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
  const missRate = hasData && stats.votedYesCount > 0
    ? Math.round(((stats.votedYesCount - stats.attendedCount) / stats.votedYesCount) * 100)
    : 0;
  const attendedPct = hasData && stats.votedYesCount > 0
    ? Math.round((stats.attendedCount / stats.votedYesCount) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-3 pt-1">
      {/* Индекс надёжности */}
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
