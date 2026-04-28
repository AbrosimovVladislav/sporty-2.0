"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTeam, type TeamMember } from "../team-context";
import { useAuth } from "@/lib/auth-context";
import { SKILL_LEVELS } from "@/lib/catalogs";
import {
  ListSearchBar,
  ListMeta,
  FilterPills,
  Avatar,
} from "@/components/ui";
import { PlayerListRow } from "@/components/players/PlayerListRow";

// ─── constants ────────────────────────────────────────────────────────────────

const POSITION_PILLS = [
  { value: "", label: "Все", fullLabel: "Все позиции" },
  { value: "Вратарь", label: "ВРТ", fullLabel: "Вратарь" },
  { value: "Защитник", label: "ЗАЩ", fullLabel: "Защитник" },
  { value: "Полузащитник", label: "ПЗЩ", fullLabel: "Полузащитник" },
  { value: "Нападающий", label: "НАП", fullLabel: "Нападающий" },
];

const SORT_OPTIONS = [
  { value: "skill", label: "По уровню" },
  { value: "recent", label: "Недавние" },
  { value: "organizers", label: "Сначала организаторы" },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function skillToNum(level: string | null): number {
  if (!level) return 0;
  const idx = SKILL_LEVELS.indexOf(level as (typeof SKILL_LEVELS)[number]);
  return idx === -1 ? 0 : idx + 1;
}

function sortMembers(members: TeamMember[], sort: string): TeamMember[] {
  const arr = [...members];
  if (sort === "skill") {
    return arr.sort((a, b) => skillToNum(b.user.skill_level) - skillToNum(a.user.skill_level));
  }
  if (sort === "recent") {
    return arr.sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime());
  }
  if (sort === "organizers") {
    return arr.sort((a, b) => {
      if (a.role === b.role) return 0;
      return a.role === "organizer" ? -1 : 1;
    });
  }
  return arr;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function RosterPage() {
  const params = useParams<{ id: string }>();
  const teamId = params.id;
  const auth = useAuth();
  const team = useTeam();

  const [searchQ, setSearchQ] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [sort, setSort] = useState("skill");
  const [activePlayer, setActivePlayer] = useState<TeamMember | null>(null);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const isOrganizer = team.status === "ready" && team.role === "organizer";
  const reload = team.status === "ready" ? team.reload : null;

  const filtered = useMemo(() => {
    if (team.status !== "ready") return [];
    let result = team.members;
    if (posFilter) result = result.filter((m) => m.user.position === posFilter);
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      result = result.filter((m) => m.user.name.toLowerCase().includes(q));
    }
    return sortMembers(result, sort);
  }, [team, posFilter, searchQ, sort]);

  if (team.status === "loading") {
    return (
      <div className="flex flex-1 flex-col px-4 pt-4">
        <div className="h-11 rounded-[14px] bg-gray-100 animate-pulse mb-3" />
        <div className="h-5 w-32 rounded bg-gray-100 animate-pulse mb-3" />
        <div className="flex gap-1.5 mb-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-9 flex-1 rounded-[10px] bg-gray-100 animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-100">
            <div className="w-11 h-11 rounded-full bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-gray-100 animate-pulse mb-1.5" />
              <div className="h-3 w-24 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (team.status !== "ready") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[14px]" style={{ color: "var(--text-tertiary)" }}>Команда не найдена</p>
      </div>
    );
  }

  const countLabel = `${filtered.length} ${filtered.length === 1 ? "игрок" : filtered.length >= 2 && filtered.length <= 4 ? "игрока" : "игроков"}`;

  return (
    <div className="flex flex-1 flex-col px-4 pt-4 pb-6" style={{ background: "var(--bg-primary)" }}>
      <ListSearchBar
        value={searchQ}
        onChange={setSearchQ}
        placeholder="Поиск по имени"
      />
      <ListMeta
        countLabel={countLabel}
        sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
      />
      <div className="mb-4">
        <FilterPills options={POSITION_PILLS} value={posFilter} onChange={setPosFilter} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-12 gap-2">
          <p className="text-[14px]" style={{ color: "var(--text-tertiary)" }}>
            {searchQ || posFilter ? "Никого не нашлось" : "Состав пуст"}
          </p>
        </div>
      ) : (
        <ul>
          {filtered.map((m) => (
            <li key={m.id}>
              <PlayerListRow
                id={m.user.id}
                name={m.user.name}
                position={m.user.position}
                city={m.user.city}
                roleBadge={m.role === "organizer" ? "Организатор" : undefined}
                onClick={() => setActivePlayer(m)}
              />
            </li>
          ))}
        </ul>
      )}

      {activePlayer && (
        <PlayerSheet
          member={activePlayer}
          currentUserId={userId}
          isOrganizer={isOrganizer}
          teamId={teamId}
          onClose={() => setActivePlayer(null)}
          onActionDone={() => {
            setActivePlayer(null);
            reload?.();
          }}
        />
      )}
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
  const skillNum = skillToNum(member.user.skill_level);
  const roleLabel = member.role === "organizer" ? "Организатор" : "Игрок";

  async function handlePromote() {
    if (!currentUserId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full bg-white pb-8"
        style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, boxShadow: "0 -8px 24px rgba(0,0,0,0.12)" }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="block w-9 h-1 rounded-full" style={{ background: "var(--gray-300)" }} />
        </div>
        <div className="flex items-center justify-between px-4 pt-1 pb-3">
          <h2 className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>
            Карточка игрока
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--gray-100)" }}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-4">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={member.user.name} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-[18px] font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {member.user.name}
              </p>
              <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {member.user.position ?? "Позиция не указана"}
              </p>
              <span
                className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                style={{
                  background: member.role === "organizer" ? "var(--green-50)" : "var(--gray-100)",
                  color: member.role === "organizer" ? "var(--green-700)" : "var(--text-secondary)",
                  letterSpacing: "0.6px",
                }}
              >
                {roleLabel}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatBox
              label="Уровень"
              value={member.user.skill_level ? `${member.user.skill_level} (${skillNum}/${SKILL_LEVELS.length})` : "—"}
            />
            <StatBox label="Город" value={member.user.city ?? "—"} />
          </div>

          {error && (
            <p className="mb-3 text-[12px] text-center" style={{ color: "#E53935" }}>
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push(`/players/${member.user.id}`)}
              className="w-full h-11 rounded-xl text-[14px] font-semibold"
              style={{ background: "var(--green-500)", color: "white" }}
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
                    style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ background: "var(--bg-secondary)" }}>
      <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="text-[15px] font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
