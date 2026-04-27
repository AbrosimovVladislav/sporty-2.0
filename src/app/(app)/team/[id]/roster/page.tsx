"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTeam, type TeamMember } from "../team-context";
import { useAuth } from "@/lib/auth-context";
import { SKILL_LEVELS } from "@/lib/catalogs";

// ─── helpers ────────────────────────────────────────────────────────────────

const CARD_SHADOW = "0 1px 2px rgba(15,20,23,0.04), 0 1px 3px rgba(15,20,23,0.05)";
const SKILL_TOTAL = SKILL_LEVELS.length; // 5

function skillToNum(level: string | null): number {
  if (!level) return 0;
  const idx = SKILL_LEVELS.indexOf(level as (typeof SKILL_LEVELS)[number]);
  return idx === -1 ? 0 : idx + 1;
}

const POS_ABBR: Record<string, string> = {
  Вратарь: "ВРТ",
  Защитник: "ЗЩТ",
  Полузащитник: "ПЗЩ",
  Нападающий: "НАП",
  Универсал: "УНВ",
};

function posAbbr(pos: string | null): string {
  if (!pos) return "—";
  return POS_ABBR[pos] ?? pos.slice(0, 3).toUpperCase();
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── types ───────────────────────────────────────────────────────────────────

type FilterKey = "all" | "gk" | "def" | "mid" | "fwd";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "gk", label: "Вратари" },
  { key: "def", label: "Защитники" },
  { key: "mid", label: "Полузащ." },
  { key: "fwd", label: "Нападающие" },
];

function matchesFilter(position: string | null, key: FilterKey): boolean {
  if (key === "all") return true;
  if (key === "gk") return position === "Вратарь";
  if (key === "def") return position === "Защитник";
  if (key === "mid") return position === "Полузащитник";
  if (key === "fwd") return position === "Нападающий";
  return true;
}

type GroupKey = "organizer" | "player";

const SECTION_META: Record<GroupKey, { title: string; color: string }> = {
  organizer: { title: "ОРГАНИЗАТОРЫ", color: "#2DB34A" },
  player: { title: "ИГРОКИ", color: "#8A8A8E" },
};

type JoinRequest = {
  id: string;
  user_id: string;
  created_at: string;
  user: { id: string; name: string; city: string | null };
};

type Modal =
  | { type: "player"; member: TeamMember }
  | { type: "requests" }
  | null;

// ─── page ────────────────────────────────────────────────────────────────────

export default function RosterPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const teamId = params.id;
  const auth = useAuth();
  const team = useTeam();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [modal, setModal] = useState<Modal>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const userId =
    auth.status === "authenticated" ? auth.user.id : null;
  const isOrganizer =
    team.status === "ready" && team.role === "organizer";
  const pendingCount =
    team.status === "ready" ? team.pendingRequestsCount : 0;
  const reload = team.status === "ready" ? team.reload : null;

  const fetchRequests = useCallback(async () => {
    if (!userId || !isOrganizer) return;
    setLoadingRequests(true);
    try {
      const res = await fetch(
        `/api/teams/${teamId}/join-requests?userId=${userId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
      }
    } finally {
      setLoadingRequests(false);
    }
  }, [teamId, userId, isOrganizer]);

  useEffect(() => {
    if (modal?.type === "requests") fetchRequests();
  }, [modal, fetchRequests]);

  if (team.status === "loading") {
    return (
      <div className="flex flex-1 flex-col min-h-screen" style={{ backgroundColor: "#F5F5F7" }}>
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          <div className="h-6 w-32 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="px-4 grid gap-2.5" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
          <div className="h-28 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="flex flex-col gap-2.5">
            <div className="h-[52px] rounded-2xl bg-gray-200 animate-pulse" />
            <div className="h-[52px] rounded-2xl bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (team.status !== "ready") {
    return (
      <div className="flex flex-1 items-center justify-center" style={{ backgroundColor: "#F5F5F7" }}>
        <p style={{ color: "#8A8A8E" }}>Команда не найдена</p>
      </div>
    );
  }

  const allMembers = team.members;
  const filtered = allMembers.filter((m) =>
    matchesFilter(m.user.position, filter),
  );
  const organizers = filtered.filter((m) => m.role === "organizer");
  const players = filtered.filter((m) => m.role === "player");

  const goalkeepersTotal = allMembers.filter(
    (m) => m.user.position === "Вратарь",
  ).length;
  const noPositionTotal = allMembers.filter((m) => !m.user.position).length;

  return (
    <div
      className="flex flex-1 flex-col min-h-screen"
      style={{ backgroundColor: "#F5F5F7" }}
    >
      <NavBar
        onBack={() => router.back()}
        onSearch={() => router.push("/players")}
        onRequests={
          isOrganizer ? () => setModal({ type: "requests" }) : undefined
        }
        requestCount={pendingCount}
      />

      <div className="px-4 pb-4">
        <StatsGrid
          total={allMembers.length}
          goalkeepers={goalkeepersTotal}
          noPosition={noPositionTotal}
        />

        <div className="mt-3 flex items-center justify-between gap-1">
          {FILTERS.map((f) => (
            <FilterPill
              key={f.key}
              label={f.label}
              active={filter === f.key}
              onClick={() => setFilter(f.key)}
            />
          ))}
        </div>

        {organizers.length > 0 && (
          <PlayerSection
            group="organizer"
            count={organizers.length}
            members={organizers}
            onPlayerClick={(m) => setModal({ type: "player", member: m })}
          />
        )}
        {players.length > 0 && (
          <PlayerSection
            group="player"
            count={players.length}
            members={players}
            onPlayerClick={(m) => setModal({ type: "player", member: m })}
          />
        )}
        {organizers.length === 0 && players.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <p className="text-[14px]" style={{ color: "#8A8A8E" }}>
              Нет игроков
            </p>
          </div>
        )}
      </div>

      {modal?.type === "player" && (
        <PlayerSheet
          member={modal.member}
          currentUserId={userId}
          isOrganizer={isOrganizer}
          teamId={teamId}
          onClose={() => setModal(null)}
          onActionDone={() => {
            setModal(null);
            reload?.();
          }}
        />
      )}
      {modal?.type === "requests" && (
        <RequestsSheet
          requests={requests}
          loading={loadingRequests}
          teamId={teamId}
          userId={userId}
          onClose={() => setModal(null)}
          onActionDone={() => {
            fetchRequests();
            reload?.();
          }}
        />
      )}
    </div>
  );
}

// ─── NavBar ──────────────────────────────────────────────────────────────────

function NavBar({
  onBack,
  onSearch,
  onRequests,
  requestCount,
}: {
  onBack: () => void;
  onSearch: () => void;
  onRequests?: () => void;
  requestCount: number;
}) {
  return (
    <header className="flex items-center justify-between px-4 pt-2 pb-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0"
          style={{ boxShadow: CARD_SHADOW }}
          aria-label="Назад"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1
          className="text-[20px] font-bold leading-none truncate"
          style={{ color: "#1A1A1A" }}
        >
          Состав
        </h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onSearch}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center"
          style={{ boxShadow: CARD_SHADOW }}
          aria-label="Найти игроков"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.5" y2="16.5" />
          </svg>
        </button>
        {onRequests && (
          <button
            onClick={onRequests}
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center relative"
            style={{ boxShadow: CARD_SHADOW }}
            aria-label="Заявки"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A1A1A"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {requestCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-1"
                style={{ backgroundColor: "#E53935" }}
              >
                <span
                  className="text-[10px] font-bold leading-none"
                  style={{ color: "#FFFFFF" }}
                >
                  {requestCount}
                </span>
              </span>
            )}
          </button>
        )}
      </div>
    </header>
  );
}

// ─── StatsGrid ───────────────────────────────────────────────────────────────

function StatsGrid({
  total,
  goalkeepers,
  noPosition,
}: {
  total: number;
  goalkeepers: number;
  noPosition: number;
}) {
  return (
    <div
      className="grid gap-2.5"
      style={{ gridTemplateColumns: "1.5fr 1fr" }}
    >
      <div
        className="bg-white rounded-2xl px-3.5 py-3 flex flex-col"
        style={{ boxShadow: CARD_SHADOW }}
      >
        <p className="text-[12px] font-medium" style={{ color: "#8A8A8E" }}>
          В составе
        </p>
        <div className="flex items-baseline gap-0.5 mt-1">
          <span
            className="text-[44px] font-bold leading-none"
            style={{ color: "#2DB34A" }}
          >
            {total}
          </span>
          <span
            className="text-[16px] font-light leading-none ml-1"
            style={{ color: "#9A9A9E" }}
          >
            игроков
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <MiniStat
          value={goalkeepers}
          valueColor={goalkeepers === 0 ? "#E53935" : "#2DB34A"}
          label="вратарей"
        />
        <MiniStat
          value={noPosition}
          valueColor={noPosition > 0 ? "#F5A623" : "#2DB34A"}
          label="без позиции"
        />
      </div>
    </div>
  );
}

function MiniStat({
  value,
  valueColor,
  label,
}: {
  value: number;
  valueColor: string;
  label: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl px-3.5 py-2 flex-1 flex flex-col justify-center"
      style={{ boxShadow: CARD_SHADOW }}
    >
      <span
        className="text-[28px] font-bold leading-none"
        style={{ color: valueColor }}
      >
        {value}
      </span>
      <span className="text-[11px] mt-0.5" style={{ color: "#8A8A8E" }}>
        {label}
      </span>
    </div>
  );
}

// ─── FilterPill ───────────────────────────────────────────────────────────────

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-2.5 h-7 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap"
      style={
        active
          ? { backgroundColor: "#2DB34A", color: "#FFFFFF" }
          : {
              backgroundColor: "#FFFFFF",
              color: "#1A1A1A",
              border: "1px solid #E5E5EA",
            }
      }
    >
      {label}
    </button>
  );
}

// ─── PlayerSection ────────────────────────────────────────────────────────────

function PlayerSection({
  group,
  count,
  members,
  onPlayerClick,
}: {
  group: GroupKey;
  count: number;
  members: TeamMember[];
  onPlayerClick: (m: TeamMember) => void;
}) {
  const meta = SECTION_META[group];
  return (
    <section className="mt-4">
      <p
        className="text-[10px] font-bold uppercase mb-0.5 px-1"
        style={{ color: meta.color, letterSpacing: "0.8px" }}
      >
        {meta.title}{" "}
        <span style={{ color: "#9A9A9E", letterSpacing: "0.4px" }}>
          · {count}
        </span>
      </p>
      <ul>
        {members.map((m, idx) => (
          <PlayerRow
            key={m.id}
            member={m}
            isLast={idx === members.length - 1}
            onClick={() => onPlayerClick(m)}
          />
        ))}
      </ul>
    </section>
  );
}

// ─── PlayerRow ────────────────────────────────────────────────────────────────

function PlayerRow({
  member,
  isLast,
  onClick,
}: {
  member: TeamMember;
  isLast: boolean;
  onClick: () => void;
}) {
  const skillNum = skillToNum(member.user.skill_level);
  const barColor = SECTION_META[member.role].color;

  return (
    <li style={{ borderBottom: isLast ? "none" : "1px solid #ECECEE" }}>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-2.5 py-2 text-left active:bg-black/3 transition-colors"
      >
        <MemberAvatar name={member.user.name} size={36} />
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] font-semibold truncate"
            style={{ color: "#1A1A1A" }}
          >
            {member.user.name}
          </p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: "#9A9A9E" }}>
            {posAbbr(member.user.position)}
            {member.user.skill_level ? ` · ${member.user.skill_level}` : ""}
          </p>
        </div>
        {skillNum > 0 && (
          <SkillBars value={skillNum} total={SKILL_TOTAL} color={barColor} />
        )}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C5C5C9"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </li>
  );
}

// ─── SkillBars ────────────────────────────────────────────────────────────────

function SkillBars({
  value,
  total,
  color,
}: {
  value: number;
  total: number;
  color: string;
}) {
  return (
    <div
      className="flex items-end gap-[2px] shrink-0"
      aria-label={`Уровень ${value} из ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: 12,
            borderRadius: 1,
            backgroundColor: i < value ? color : "#E5E5EA",
          }}
        />
      ))}
    </div>
  );
}

// ─── MemberAvatar ─────────────────────────────────────────────────────────────

function MemberAvatar({ name, size = 36 }: { name: string; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden flex items-center justify-center shrink-0"
      style={{ width: size, height: size, backgroundColor: "#E8F7EC" }}
    >
      <span
        className="font-semibold"
        style={{
          color: "#2DB34A",
          fontSize: Math.round(size / 2.8),
        }}
      >
        {initials(name)}
      </span>
    </div>
  );
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────

function BottomSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[480px] bg-white rounded-t-2xl pb-6"
        style={{ boxShadow: "0 -8px 24px rgba(0,0,0,0.12)" }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span
            className="block w-9 h-1 rounded-full"
            style={{ backgroundColor: "#D9D9DC" }}
          />
        </div>
        <div className="flex items-center justify-between px-4 pt-1 pb-3">
          <h2
            className="text-[16px] font-bold"
            style={{ color: "#1A1A1A" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#F0F0F2" }}
            aria-label="Закрыть"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1A1A1A"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="px-4">{children}</div>
      </div>
    </div>
  );
}

// ─── PlayerSheet ──────────────────────────────────────────────────────────────

function PlayerSheet({
  member,
  currentUserId,
  isOrganizer,
  teamId,
  onClose,
  onActionDone,
}: {
  member: TeamMember;
  currentUserId: string | null;
  isOrganizer: boolean;
  teamId: string;
  onClose: () => void;
  onActionDone: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = member.user.id === currentUserId;
  const isTargetOrganizer = member.role === "organizer";

  async function handlePromote() {
    if (!currentUserId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/teams/${teamId}/members/${member.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        },
      );
      if (res.ok) {
        onActionDone();
      } else {
        const data = await res.json();
        setError(data.error ?? "Ошибка");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!currentUserId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/teams/${teamId}/members/${member.id}?userId=${currentUserId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        onActionDone();
      } else {
        const data = await res.json();
        setError(data.error ?? "Ошибка");
      }
    } finally {
      setBusy(false);
    }
  }

  const skillNum = skillToNum(member.user.skill_level);
  const roleLabel =
    member.role === "organizer" ? "Организатор" : "Игрок";

  return (
    <BottomSheet title="Карточка игрока" onClose={onClose}>
      <div className="flex items-center gap-3">
        <MemberAvatar name={member.user.name} size={64} />
        <div className="flex-1 min-w-0">
          <p
            className="text-[18px] font-bold truncate"
            style={{ color: "#1A1A1A" }}
          >
            {member.user.name}
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: "#8A8A8E" }}>
            {member.user.position ?? "Позиция не указана"}
          </p>
          <span
            className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
            style={{
              backgroundColor:
                member.role === "organizer" ? "#E8F7EC" : "#F0F0F2",
              color: member.role === "organizer" ? "#2DB34A" : "#8A8A8E",
              letterSpacing: "0.6px",
            }}
          >
            {roleLabel}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatBox
          label="Уровень"
          value={
            member.user.skill_level
              ? `${member.user.skill_level} (${skillNum}/${SKILL_TOTAL})`
              : "—"
          }
        />
        <StatBox label="Город" value={member.user.city ?? "—"} />
      </div>

      {error && (
        <p className="mt-3 text-[12px] text-center" style={{ color: "#E53935" }}>
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={() => router.push(`/players/${member.user.id}`)}
          className="w-full h-11 rounded-xl text-[14px] font-semibold"
          style={{ backgroundColor: "#2DB34A", color: "#FFFFFF" }}
        >
          Открыть профиль
        </button>

        {isOrganizer && !isSelf && (
          <>
            {!isTargetOrganizer && (
              <button
                onClick={handlePromote}
                disabled={busy}
                className="w-full h-11 rounded-xl text-[14px] font-semibold disabled:opacity-50"
                style={{ backgroundColor: "#F0F0F2", color: "#1A1A1A" }}
              >
                {busy ? "Обновляю…" : "Сделать организатором"}
              </button>
            )}
            <button
              onClick={handleRemove}
              disabled={busy}
              className="w-full h-11 rounded-xl text-[14px] font-semibold disabled:opacity-50"
              style={{ backgroundColor: "#FFF1F1", color: "#E53935" }}
            >
              {busy ? "Удаляю…" : "Удалить из команды"}
            </button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ backgroundColor: "#F5F5F7" }}
    >
      <p className="text-[11px]" style={{ color: "#8A8A8E" }}>
        {label}
      </p>
      <p
        className="text-[15px] font-semibold mt-0.5"
        style={{ color: "#1A1A1A" }}
      >
        {value}
      </p>
    </div>
  );
}

// ─── RequestsSheet ────────────────────────────────────────────────────────────

function RequestsSheet({
  requests,
  loading,
  teamId,
  userId,
  onClose,
  onActionDone,
}: {
  requests: JoinRequest[];
  loading: boolean;
  teamId: string;
  userId: string | null;
  onClose: () => void;
  onActionDone: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function handleDecision(
    requestId: string,
    action: "accept" | "reject",
  ) {
    if (!userId || busy) return;
    setBusy(requestId);
    try {
      await fetch(`/api/teams/${teamId}/join-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      onActionDone();
    } finally {
      setBusy(null);
    }
  }

  return (
    <BottomSheet title={`Заявки · ${requests.length}`} onClose={onClose}>
      {loading ? (
        <div className="py-6 flex justify-center">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#2DB34A", borderTopColor: "transparent" }}
          />
        </div>
      ) : requests.length === 0 ? (
        <p
          className="text-[13px] py-6 text-center"
          style={{ color: "#8A8A8E" }}
        >
          Новых заявок нет
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => (
            <li
              key={r.id}
              className="rounded-xl p-3"
              style={{ backgroundColor: "#F5F5F7" }}
            >
              <div className="flex items-start gap-3">
                <MemberAvatar name={r.user.name} size={44} />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[14px] font-semibold truncate"
                    style={{ color: "#1A1A1A" }}
                  >
                    {r.user.name}
                  </p>
                  {r.user.city && (
                    <p
                      className="text-[11px] mt-0.5"
                      style={{ color: "#9A9A9E" }}
                    >
                      {r.user.city}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleDecision(r.id, "accept")}
                  disabled={busy === r.id}
                  className="flex-1 h-9 rounded-lg text-[13px] font-semibold disabled:opacity-50"
                  style={{ backgroundColor: "#2DB34A", color: "#FFFFFF" }}
                >
                  {busy === r.id ? "…" : "Принять"}
                </button>
                <button
                  onClick={() => handleDecision(r.id, "reject")}
                  disabled={busy === r.id}
                  className="flex-1 h-9 rounded-lg text-[13px] font-semibold disabled:opacity-50"
                  style={{
                    backgroundColor: "#FFFFFF",
                    color: "#1A1A1A",
                    border: "1px solid #E5E5EA",
                  }}
                >
                  {busy === r.id ? "…" : "Отклонить"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
