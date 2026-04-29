"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { SKILL_LEVELS, EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { formatMoney } from "@/lib/format";

export type TeamPlayerSheetMember = {
  id: string;
  role: "organizer" | "player";
  user: {
    id: string;
    name: string;
    city: string | null;
    position: string | null;
    skill_level: string | null;
    avatar_url: string | null;
  };
};

type Props = {
  member: TeamPlayerSheetMember;
  teamId: string;
  currentUserId: string | null;
  isOrganizer: boolean;
  onClose: () => void;
  onActionDone: () => void;
};

type ReliabilityData = {
  totals: {
    played: number;
    votedYes: number;
    noShow: number;
    cancelled: number;
    reliability: number | null;
  };
  recentEvents: {
    event_id: string;
    type: string;
    date: string;
    vote: "yes" | "no" | null;
    attended: boolean | null;
  }[];
};

type FinancesData = {
  totals: { expected: number; paid: number; balance: number };
  history: {
    id: string;
    amount: number;
    type: string;
    label: string;
    note: string | null;
    created_at: string;
  }[];
};

type Section = "reliability" | "finances" | "stats" | null;

export function TeamPlayerSheet({
  member,
  teamId,
  currentUserId,
  isOrganizer,
  onClose,
  onActionDone,
}: Props) {
  const router = useRouter();
  const [openSection, setOpenSection] = useState<Section>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const [reliability, setReliability] = useState<ReliabilityData | null | undefined>(undefined);
  const [finances, setFinances] = useState<FinancesData | null | undefined>(undefined);

  const isSelf = member.user.id === currentUserId;
  const isTargetOrganizer = member.role === "organizer";
  const canSeeFinances = isOrganizer || isSelf;

  const positions = (member.user.position ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const skillNum = skillToNum(member.user.skill_level);

  useEffect(() => {
    if (openSection !== "reliability" || reliability !== undefined) return;
    if (!currentUserId) return;
    fetch(`/api/teams/${teamId}/members/${member.user.id}/reliability?userId=${currentUserId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setReliability(d))
      .catch(() => setReliability(null));
  }, [openSection, reliability, currentUserId, teamId, member.user.id]);

  useEffect(() => {
    if (openSection !== "finances" || finances !== undefined) return;
    if (!currentUserId || !canSeeFinances) return;
    fetch(`/api/teams/${teamId}/members/${member.user.id}/finances?userId=${currentUserId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFinances(d))
      .catch(() => setFinances(null));
  }, [openSection, finances, currentUserId, teamId, member.user.id, canSeeFinances]);

  function toggleSection(s: Exclude<Section, null>) {
    setOpenSection((cur) => (cur === s ? null : s));
  }

  async function handlePromote() {
    if (!currentUserId || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      if (res.ok) onActionDone();
      else {
        const data = await res.json();
        setActionError(data.error ?? "Ошибка");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!currentUserId || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/teams/${teamId}/members/${member.id}?userId=${currentUserId}`,
        { method: "DELETE" },
      );
      if (res.ok) onActionDone();
      else {
        const data = await res.json();
        setActionError(data.error ?? "Ошибка");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!currentUserId || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      if (res.ok) router.replace("/home");
      else {
        const data = await res.json();
        setActionError(data.error ?? "Ошибка");
        setConfirmLeave(false);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full bg-white pb-8 max-h-[88vh] overflow-y-auto"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span
            className="block w-9 h-1 rounded-full"
            style={{ background: "var(--gray-300)" }}
          />
        </div>
        <div className="flex items-center justify-end px-4 pt-1 pb-2">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--gray-100)" }}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-4 flex flex-col gap-3">
          {/* Header — always visible */}
          <div className="flex items-start gap-3">
            <Avatar
              src={member.user.avatar_url}
              name={member.user.name}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className="text-[18px] font-bold leading-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {member.user.name}
                </p>
                {isTargetOrganizer && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                    style={{
                      background: "var(--green-50)",
                      color: "var(--green-700)",
                      letterSpacing: "0.6px",
                    }}
                  >
                    Организатор
                  </span>
                )}
              </div>

              {(positions.length > 0 || member.user.skill_level || member.user.city) && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {positions.map((p) => (
                    <Chip key={p}>{p}</Chip>
                  ))}
                  {member.user.skill_level && (
                    <Chip>
                      {member.user.skill_level} · {skillNum}/{SKILL_LEVELS.length}
                    </Chip>
                  )}
                  {member.user.city && <Chip>{member.user.city}</Chip>}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push(`/players/${member.user.id}`)}
            className="w-full h-11 rounded-xl text-[14px] font-semibold"
            style={{ background: "var(--gray-100)", color: "var(--text-primary)" }}
          >
            Открыть профиль
          </button>

          {/* Accordion: Reliability */}
          <Accordion
            label="Надёжность · в этой команде"
            open={openSection === "reliability"}
            onToggle={() => toggleSection("reliability")}
          >
            {reliability === undefined ? (
              <SkeletonRow />
            ) : reliability === null ||
              reliability.totals.votedYes + reliability.totals.cancelled === 0 ? (
              <Empty text="Нет завершённых событий" />
            ) : (
              <ReliabilityBody data={reliability} />
            )}
          </Accordion>

          {/* Accordion: Finances (organizer or self only) */}
          {canSeeFinances && (
            <Accordion
              label="Финансы · в этой команде"
              open={openSection === "finances"}
              onToggle={() => toggleSection("finances")}
            >
              {finances === undefined ? (
                <SkeletonRow />
              ) : finances === null ? (
                <Empty text="Не удалось загрузить" />
              ) : (
                <FinancesBody data={finances} />
              )}
            </Accordion>
          )}

          {/* Accordion: Game stats placeholder */}
          <Accordion
            label="Игровая статистика"
            open={openSection === "stats"}
            onToggle={() => toggleSection("stats")}
          >
            <Empty text="🏗 Скоро — голы, передачи, MVP" />
          </Accordion>

          {actionError && (
            <p
              className="text-[12px] text-center"
              style={{ color: "#E53935" }}
            >
              {actionError}
            </p>
          )}

          {/* Actions */}
          {isOrganizer && !isSelf && (
            <div className="flex flex-col gap-2 pt-1">
              {!isTargetOrganizer && (
                <button
                  onClick={handlePromote}
                  disabled={busy}
                  className="w-full h-11 rounded-xl text-[14px] font-semibold disabled:opacity-50"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                >
                  {busy ? "Обновляю…" : "Сделать организатором"}
                </button>
              )}
              <button
                onClick={handleRemove}
                disabled={busy}
                className="w-full h-11 rounded-xl text-[14px] font-semibold disabled:opacity-50"
                style={{ background: "#FFF1F1", color: "#E53935" }}
              >
                {busy ? "Удаляю…" : "Удалить из команды"}
              </button>
            </div>
          )}

          {isSelf &&
            (confirmLeave ? (
              <div className="rounded-xl p-3" style={{ background: "#FFF1F1" }}>
                <p
                  className="text-[13px] text-center mb-3"
                  style={{ color: "#E53935" }}
                >
                  Вы уверены? Вы покинете команду.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmLeave(false)}
                    className="flex-1 h-10 rounded-xl text-[14px] font-semibold"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleLeave}
                    disabled={busy}
                    className="flex-1 h-10 rounded-xl text-[14px] font-semibold disabled:opacity-50"
                    style={{ background: "#E53935", color: "white" }}
                  >
                    {busy ? "Выхожу…" : "Выйти"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLeave(true)}
                className="w-full h-11 rounded-xl text-[14px] font-semibold"
                style={{ background: "#FFF1F1", color: "#E53935" }}
              >
                Покинуть команду
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Accordion ────────────────────────────────────────────── */

function Accordion({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--bg-secondary)" }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span
          className="text-[14px] font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </span>
        <span
          className="transition-transform shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        >
          <ChevronDownIcon />
        </span>
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

/* ─── Reliability body ─────────────────────────────────────── */

function ReliabilityBody({ data }: { data: ReliabilityData }) {
  const { reliability, votedYes, noShow, cancelled, played } = data.totals;
  const reliabilityLabel =
    reliability === null
      ? "—"
      : reliability >= 90
        ? "Стабильный"
        : reliability >= 70
          ? "Надёжный"
          : reliability >= 50
            ? "Средняя"
            : "Низкая";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p
            className="font-display text-[28px] font-bold leading-none tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {reliability !== null ? `${reliability}%` : "—"}
          </p>
          {reliability !== null && (
            <p
              className="text-[12px] mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {reliabilityLabel}
            </p>
          )}
        </div>
        <p
          className="text-[12px] tabular-nums text-right"
          style={{ color: "var(--text-secondary)" }}
        >
          {played} из {votedYes} записей
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Неприходы" value={noShow} bad={noShow > 0} />
        <MiniStat label="Отмены" value={cancelled} bad={false} />
      </div>

      {data.recentEvents.length > 0 && (
        <ul
          className="rounded-lg overflow-hidden"
          style={{ background: "var(--bg-primary)" }}
        >
          {data.recentEvents.map((e, i) => {
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
                  ? e.vote === "no"
                    ? "Отменил"
                    : "Не пришёл"
                  : `Записался — ${EVENT_TYPE_LABEL[e.type] ?? e.type}`;
            return (
              <li
                key={e.event_id}
                className="flex items-center justify-between px-3 py-2.5"
                style={{
                  borderTop: i === 0 ? undefined : "1px solid var(--gray-100)",
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: dotColor }}
                  />
                  <span
                    className="text-[13px] truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {label}
                  </span>
                </div>
                <span
                  className="text-[12px] shrink-0 ml-2 tabular-nums"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {formatShortDate(e.date)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ─── Finances body ────────────────────────────────────────── */

function FinancesBody({ data }: { data: FinancesData }) {
  const { expected, paid, balance } = data.totals;
  const positiveBalance = balance >= 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <div>
          <p
            className="text-[11px] uppercase font-semibold"
            style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
          >
            {positiveBalance ? "Переплата" : "Долг"}
          </p>
          <p
            className="font-display text-[28px] font-bold leading-none tabular-nums"
            style={{
              color: positiveBalance ? "var(--green-600)" : "var(--danger)",
            }}
          >
            {formatMoney(Math.abs(balance))} ₸
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniStat label="Должен сдать" value={`${formatMoney(expected)} ₸`} />
        <MiniStat label="Сдал" value={`${formatMoney(paid)} ₸`} />
      </div>

      {data.history.length > 0 && (
        <ul
          className="rounded-lg overflow-hidden"
          style={{ background: "var(--bg-primary)" }}
        >
          {data.history.slice(0, 8).map((h, i) => (
            <li
              key={h.id}
              className="flex items-center justify-between px-3 py-2.5"
              style={{
                borderTop: i === 0 ? undefined : "1px solid var(--gray-100)",
              }}
            >
              <span
                className="text-[13px] truncate min-w-0 mr-2"
                style={{ color: "var(--text-primary)" }}
              >
                {h.label}
              </span>
              <span
                className="text-[13px] font-semibold tabular-nums shrink-0"
                style={{
                  color:
                    h.type === "deposit"
                      ? "var(--green-600)"
                      : "var(--text-primary)",
                }}
              >
                +{formatMoney(h.amount)} ₸
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─── Atoms ────────────────────────────────────────────────── */

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="px-2.5 py-1 rounded-full text-[12px] font-medium"
      style={{
        background: "var(--bg-secondary)",
        color: "var(--text-secondary)",
      }}
    >
      {children}
    </span>
  );
}

function MiniStat({
  label,
  value,
  bad = false,
}: {
  label: string;
  value: string | number;
  bad?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{ background: "var(--bg-primary)" }}
    >
      <p
        className="text-[11px]"
        style={{ color: "var(--text-tertiary)" }}
      >
        {label}
      </p>
      <p
        className="text-[15px] font-semibold mt-0.5 tabular-nums"
        style={{ color: bad ? "var(--danger)" : "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p
      className="text-[13px] py-2 text-center"
      style={{ color: "var(--text-tertiary)" }}
    >
      {text}
    </p>
  );
}

function SkeletonRow() {
  return (
    <div className="flex flex-col gap-2 py-2">
      <div
        className="h-6 w-24 rounded animate-pulse"
        style={{ background: "var(--gray-100)" }}
      />
      <div
        className="h-3 w-full rounded animate-pulse"
        style={{ background: "var(--gray-100)" }}
      />
    </div>
  );
}

function skillToNum(level: string | null): number {
  if (!level) return 0;
  const idx = SKILL_LEVELS.indexOf(level as (typeof SKILL_LEVELS)[number]);
  return idx === -1 ? 0 : idx + 1;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
}

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronDownIcon() {
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
      style={{ color: "var(--text-secondary)" }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
