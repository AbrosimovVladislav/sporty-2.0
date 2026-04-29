"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui";
import { PositionChipList } from "@/components/PositionChip";
import { SKILL_LEVELS, EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { formatMoney } from "@/lib/format";

export type TeamPlayerSheetMember = {
  id: string;
  role: "organizer" | "player";
  user: {
    id: string;
    name: string;
    city: string | null;
    position: string[] | null;
    skill_level: string | null;
    avatar_url: string | null;
  };
};

type Props = {
  member: TeamPlayerSheetMember;
  teamId: string;
  currentUserId: string | null;
  isOrganizer: boolean;
  initialSection?: "reliability" | "finances" | "stats";
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
    event_id: string | null;
  }[];
};

type Section = "reliability" | "finances" | "stats" | null;

export function TeamPlayerSheet({
  member,
  teamId,
  currentUserId,
  isOrganizer,
  initialSection,
  onClose,
  onActionDone,
}: Props) {
  const router = useRouter();
  const [openSection, setOpenSection] = useState<Section>(initialSection ?? null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const [reliability, setReliability] = useState<ReliabilityData | null | undefined>(undefined);
  const [finances, setFinances] = useState<FinancesData | null | undefined>(undefined);

  const isSelf = member.user.id === currentUserId;
  const isTargetOrganizer = member.role === "organizer";
  const canSeeFinances = isOrganizer || isSelf;

  const positions = member.user.position ?? [];
  const skillNum = skillToNum(member.user.skill_level);

  // Pre-fetch reliability/finances summary so peek-info shows without expanding
  useEffect(() => {
    if (!currentUserId) return;
    fetch(`/api/teams/${teamId}/members/${member.user.id}/reliability?userId=${currentUserId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setReliability(d))
      .catch(() => setReliability(null));
  }, [currentUserId, teamId, member.user.id]);

  useEffect(() => {
    if (!currentUserId || !canSeeFinances) {
      setFinances(null);
      return;
    }
    fetch(`/api/teams/${teamId}/members/${member.user.id}/finances?userId=${currentUserId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFinances(d))
      .catch(() => setFinances(null));
  }, [currentUserId, teamId, member.user.id, canSeeFinances]);

  function toggleSection(s: Exclude<Section, null>) {
    setOpenSection((cur) => (cur === s ? null : s));
  }

  function navigateToEvent(eventId: string) {
    router.push(`/team/${teamId}/events/${eventId}`);
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

  // Peek summaries for collapsed accordions
  const reliabilityPeek = peekReliability(reliability);
  const financesPeek = peekFinances(finances);

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
          {/* Header */}
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

              {/* Position chips + city */}
              {(positions.length > 0 || member.user.city) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <PositionChipList positions={positions} tone="light" />
                  {member.user.city && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium"
                      style={{
                        background: "var(--bg-secondary)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <PinIcon />
                      {member.user.city}
                    </span>
                  )}
                </div>
              )}

              {/* Skill — distinct colored badge */}
              {member.user.skill_level && (
                <div className="mt-2">
                  <SkillBadge level={member.user.skill_level} num={skillNum} />
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

          {/* Reliability accordion */}
          <Accordion
            label="Надёжность · в этой команде"
            open={openSection === "reliability"}
            onToggle={() => toggleSection("reliability")}
            peek={reliabilityPeek}
          >
            {reliability === undefined ? (
              <SkeletonRow />
            ) : reliability === null ||
              reliability.totals.votedYes + reliability.totals.cancelled === 0 ? (
              <Empty text="Нет завершённых событий" />
            ) : (
              <ReliabilityBody
                data={reliability}
                onEventClick={navigateToEvent}
              />
            )}
          </Accordion>

          {/* Finances accordion (organizer or self only) */}
          {canSeeFinances && (
            <Accordion
              label="Финансы · в этой команде"
              open={openSection === "finances"}
              onToggle={() => toggleSection("finances")}
              peek={financesPeek}
            >
              {finances === undefined ? (
                <SkeletonRow />
              ) : finances === null ? (
                <Empty text="Не удалось загрузить" />
              ) : (
                <FinancesBody data={finances} onEventClick={navigateToEvent} />
              )}
            </Accordion>
          )}

          {/* Game stats placeholder */}
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

/* ─── Peek summaries ───────────────────────────────────────── */

type PeekContent = {
  primary: string;
  primaryColor?: string;
  secondary?: string;
};

function peekReliability(d: ReliabilityData | null | undefined): PeekContent | null {
  if (d === undefined) return null;
  if (!d || d.totals.votedYes + d.totals.cancelled === 0) {
    return { primary: "—", secondary: "Нет данных" };
  }
  const { reliability, noShow, cancelled } = d.totals;
  const issues: string[] = [];
  if (noShow > 0) issues.push(`${noShow} неприход${plural(noShow)}`);
  if (cancelled > 0) issues.push(`${cancelled} отмен${pluralCancel(cancelled)}`);

  return {
    primary: reliability !== null ? `${reliability}%` : "—",
    primaryColor:
      reliability !== null && reliability >= 90
        ? "var(--green-600)"
        : reliability !== null && reliability >= 70
          ? "var(--text-primary)"
          : "var(--danger)",
    secondary: issues.length > 0 ? issues.join(" · ") : "Без нарушений",
  };
}

function peekFinances(d: FinancesData | null | undefined): PeekContent | null {
  if (d === undefined) return null;
  if (!d) return null;
  const { expected, paid, balance } = d.totals;
  const positiveBalance = balance >= 0;
  const balanceStr =
    balance === 0
      ? "0 ₸"
      : `${positiveBalance ? "+" : "−"}${formatMoney(Math.abs(balance))} ₸`;

  return {
    primary: balanceStr,
    primaryColor: positiveBalance ? "var(--green-600)" : "var(--danger)",
    secondary: `Сдал ${formatMoney(paid)} из ${formatMoney(expected)} ₸`,
  };
}

function plural(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "";
  return "а";
}

function pluralCancel(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return "а";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "ы";
  return "";
}

/* ─── Accordion ────────────────────────────────────────────── */

function Accordion({
  label,
  open,
  onToggle,
  peek,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  peek?: PeekContent | null;
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
        className="w-full flex items-center justify-between px-4 py-3 text-left gap-3"
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span
            className="text-[14px] font-semibold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {label}
          </span>
          {!open && peek?.secondary && (
            <span
              className="text-[11px] mt-0.5 truncate"
              style={{ color: "var(--text-tertiary)" }}
            >
              {peek.secondary}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!open && peek?.primary && (
            <span
              className="text-[15px] font-bold tabular-nums"
              style={{ color: peek.primaryColor ?? "var(--text-primary)" }}
            >
              {peek.primary}
            </span>
          )}
          <span
            className="transition-transform shrink-0"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
          >
            <ChevronDownIcon />
          </span>
        </div>
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

/* ─── Reliability body ─────────────────────────────────────── */

function ReliabilityBody({
  data,
  onEventClick,
}: {
  data: ReliabilityData;
  onEventClick: (eventId: string) => void;
}) {
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
                style={{
                  borderTop: i === 0 ? undefined : "1px solid var(--gray-100)",
                }}
              >
                <button
                  type="button"
                  onClick={() => onEventClick(e.event_id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left active:bg-[var(--gray-50)]"
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
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <span
                      className="text-[12px] tabular-nums"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {formatShortDate(e.date)}
                    </span>
                    <ChevronRightIcon />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ─── Finances body ────────────────────────────────────────── */

function FinancesBody({
  data,
  onEventClick,
}: {
  data: FinancesData;
  onEventClick: (eventId: string) => void;
}) {
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
          {data.history.slice(0, 8).map((h, i) => {
            const clickable = !!h.event_id;
            const inner = (
              <>
                <span
                  className="text-[13px] truncate min-w-0 mr-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {h.label}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className="text-[13px] font-semibold tabular-nums"
                    style={{
                      color:
                        h.type === "deposit"
                          ? "var(--green-600)"
                          : "var(--text-primary)",
                    }}
                  >
                    +{formatMoney(h.amount)} ₸
                  </span>
                  {clickable && <ChevronRightIcon />}
                </div>
              </>
            );
            return (
              <li
                key={h.id}
                style={{
                  borderTop: i === 0 ? undefined : "1px solid var(--gray-100)",
                }}
              >
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => onEventClick(h.event_id!)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left active:bg-[var(--gray-50)]"
                  >
                    {inner}
                  </button>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2.5">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ─── Atoms ────────────────────────────────────────────────── */

function SkillBadge({ level, num }: { level: string; num: number }) {
  const total = SKILL_LEVELS.length;
  // Color scale by skill rank
  const palette: Record<number, { bg: string; fg: string }> = {
    1: { bg: "#F1F4F8", fg: "#6B7280" },
    2: { bg: "#E8F0FE", fg: "#1F66D9" },
    3: { bg: "#E6F7EC", fg: "#1F8A4C" },
    4: { bg: "#FFF4E0", fg: "#B86E00" },
    5: { bg: "#FFE3E3", fg: "#C12A2A" },
  };
  const c = palette[num] ?? palette[1];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold"
      style={{ background: c.bg, color: c.fg }}
    >
      <StarIcon />
      {level} · {num}/{total}
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

/* ─── Icons ────────────────────────────────────────────────── */

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

function ChevronRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--text-tertiary)" }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}
