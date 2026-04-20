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
  created_at: string;
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

  async function toggleLookingForTeam() {
    await saveField("looking_for_team", !user.looking_for_team);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "about", label: "Обо мне" },
    { id: "results", label: "Результаты" },
    { id: "reliability", label: "Надёжность" },
  ];

  return (
    <div className="flex flex-1 flex-col p-4 gap-4">
      {/* Header */}
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-5">
        <p className="text-foreground-on-dark-muted text-xs uppercase font-display tracking-wide">Профиль</p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">{user.name}</h1>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {user.city && (
            <span className="text-xs text-foreground-on-dark-muted bg-background-dark-elevated rounded-full px-3 py-1">
              {user.city}
            </span>
          )}
          {user.sport && (
            <span className="text-xs text-foreground-on-dark-muted bg-background-dark-elevated rounded-full px-3 py-1">
              {SPORT_LABEL[user.sport] ?? user.sport}
            </span>
          )}
          <button
            onClick={toggleLookingForTeam}
            disabled={savingField === "looking_for_team"}
            className={`text-xs rounded-full px-3 py-1 font-medium transition-colors disabled:opacity-50 ${
              user.looking_for_team
                ? "bg-primary text-primary-foreground"
                : "bg-background-dark-elevated text-foreground-on-dark-muted"
            }`}
          >
            {user.looking_for_team ? "Ищу команду" : "Не ищу команду"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto">
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
      {tab === "about" && (
        <AboutTab user={user} savingField={savingField} onSave={saveField} />
      )}
      {tab === "results" && <ResultsTab userId={user.id} />}
      {tab === "reliability" && <ReliabilityTab userId={user.id} />}

      {/* Join requests — always below tabs */}
      <MyJoinRequests userId={user.id} />
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

  const age = user.birth_date ? calcAge(user.birth_date) : null;

  const fields: { key: string; label: string; value: string | null; placeholder: string; type?: string }[] = [
    { key: "bio", label: "О себе", value: user.bio, placeholder: "Расскажи о себе…" },
    { key: "position", label: "Позиция", value: user.position, placeholder: "Нападающий, вратарь…" },
    { key: "skill_level", label: "Уровень", value: user.skill_level, placeholder: "Любитель, полупрофи…" },
    { key: "preferred_time", label: "Время тренировок", value: user.preferred_time, placeholder: "Вечер буднями, выходные…" },
    {
      key: "birth_date",
      label: age !== null ? `Возраст — ${age} лет` : "Дата рождения",
      value: user.birth_date,
      placeholder: "ГГГГ-ММ-ДД",
      type: "date",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {fields.map(({ key, label, value, placeholder, type }) => (
        <InlineField
          key={key}
          fieldKey={key}
          label={label}
          value={value}
          placeholder={placeholder}
          inputType={type}
          saving={savingField === key}
          onSave={onSave}
        />
      ))}
    </div>
  );
}

function InlineField({
  fieldKey,
  label,
  value,
  placeholder,
  inputType = "text",
  saving,
  onSave,
}: {
  fieldKey: string;
  label: string;
  value: string | null;
  placeholder: string;
  inputType?: string;
  saving: boolean;
  onSave: (field: string, value: unknown) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEdit() {
    setDraft(value ?? "");
    setEditing(true);
  }

  async function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    const next = trimmed === "" ? null : trimmed;
    if (next !== value) await onSave(fieldKey, next);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && fieldKey !== "bio") commit();
    if (e.key === "Escape") setEditing(false);
  }

  return (
    <div className="bg-background-card border border-border rounded-lg px-4 py-3">
      <p className="text-xs text-foreground-secondary mb-1">{label}</p>
      {editing ? (
        fieldKey === "bio" ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={3}
            className="w-full text-sm bg-transparent focus:outline-none resize-none"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={inputType}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full text-sm bg-transparent focus:outline-none"
          />
        )
      ) : (
        <button
          onClick={startEdit}
          disabled={saving}
          className="w-full text-left text-sm disabled:opacity-50"
        >
          {saving ? (
            <span className="text-foreground-secondary">Сохраняю…</span>
          ) : value ? (
            <span>{value}</span>
          ) : (
            <span className="text-foreground-secondary">{placeholder}</span>
          )}
        </button>
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

  const grid = [
    { label: "Сыграно", value: stats?.playedCount ?? null, soon: false },
    { label: "Победы", value: null, soon: true },
    { label: "Передачи", value: null, soon: true },
    { label: "Карточки", value: null, soon: true },
  ];

  return (
    <section className="bg-background-card border border-border rounded-lg p-5">
      <p className="text-xs uppercase font-display text-foreground-secondary mb-3">Результаты</p>
      {stats === undefined ? (
        <div className="h-16 animate-pulse bg-border rounded" />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {grid.map(({ label, value, soon }) => (
            <div key={label}>
              <p className="text-2xl font-display font-bold">
                {soon || value === null ? "—" : value}
              </p>
              <p className="text-xs text-foreground-secondary">
                {label}
                {soon && <span className="ml-1 opacity-50">скоро</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ─── Надёжность ───────────────────────────────────────────── */

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
    return <div className="h-32 animate-pulse bg-border rounded-lg" />;
  }

  const reliability = stats?.reliability ?? null;
  const hasData = stats && stats.votedYesCount > 0;

  return (
    <div className="flex flex-col gap-4">
      <section className="bg-background-card border border-border rounded-lg p-5">
        <p className="text-xs uppercase font-display text-foreground-secondary mb-4">Надёжность</p>
        {!hasData ? (
          <p className="text-sm text-foreground-secondary">
            Данных пока нет. Надёжность считается после первых завершённых событий.
          </p>
        ) : (
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <CircularProgress value={reliability ?? 0} size={96} strokeWidth={8} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-display font-bold">
                  {reliability !== null ? `${reliability}%` : "—"}
                </span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{reliability !== null ? `${reliability}%` : "—"}</p>
              <p className="text-sm text-foreground-secondary mt-1">
                {stats.attendedCount} из {stats.votedYesCount} событий
              </p>
              <p className="text-xs text-foreground-secondary mt-0.5">
                где записался — пришёл
              </p>
            </div>
          </div>
        )}
      </section>

      {stats && stats.recentEvents.length > 0 && (
        <section className="bg-background-card border border-border rounded-lg p-5">
          <p className="text-xs uppercase font-display text-foreground-secondary mb-3">
            Последние события
          </p>
          <ul className="flex flex-col gap-2">
            {stats.recentEvents.map((e) => (
              <li key={e.event_id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{EVENT_TYPE_LABEL[e.type] ?? e.type}</p>
                  <p className="text-xs text-foreground-secondary">
                    {new Date(e.date).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium rounded-full px-2.5 py-1 ${
                    e.attended
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {e.attended ? "Был" : "Не пришёл"}
                </span>
              </li>
            ))}
          </ul>
        </section>
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
    <section>
      <p className="text-xs uppercase font-display text-foreground-secondary mb-2">Мои заявки</p>
      {requests === null ? (
        <div className="bg-background-card border border-border rounded-lg p-5 text-center text-foreground-secondary text-sm">
          Загружаю…
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
                  <span className={`text-xs font-display font-semibold uppercase px-2 py-1 rounded ${STATUS_STYLE[r.status] ?? ""}`}>
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
