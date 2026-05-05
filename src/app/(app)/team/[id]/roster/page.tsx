"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTeam, type TeamMember } from "../team-context";
import { useAuth } from "@/lib/auth-context";
import { ListSearchBar, ListMeta, SheetChipGroup } from "@/components/ui";
import { PlayerListRow } from "@/components/players/PlayerListRow";
import { TeamPlayerSheet } from "@/components/team/lazy";
import { skillToNum } from "@/lib/playerBadges";

const POSITION_OPTIONS = [
  { value: "Вратарь", label: "Вратарь" },
  { value: "Защитник", label: "Защитник" },
  { value: "Полузащитник", label: "Полузащитник" },
  { value: "Нападающий", label: "Нападающий" },
];

const SORT_OPTIONS = [
  { value: "skill", label: "По уровню" },
  { value: "organizers", label: "Сначала организаторы" },
];

function sortMembers(members: TeamMember[], sort: string): TeamMember[] {
  const arr = [...members];
  if (sort === "skill") {
    return arr.sort(
      (a, b) => skillToNum(b.user.skill_level) - skillToNum(a.user.skill_level),
    );
  }
  if (sort === "organizers") {
    return arr.sort((a, b) => {
      if (a.role === b.role) return 0;
      return a.role === "organizer" ? -1 : 1;
    });
  }
  return arr;
}

export default function RosterPage() {
  const params = useParams<{ id: string }>();
  const teamId = params.id;
  const auth = useAuth();
  const team = useTeam();

  const [searchQ, setSearchQ] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [sort, setSort] = useState("skill");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activePlayer, setActivePlayer] = useState<TeamMember | null>(null);

  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const isOrganizer = team.status === "ready" && team.role === "organizer";
  const reload = team.status === "ready" ? team.reload : null;

  const filtered = useMemo(() => {
    if (team.status !== "ready") return [];
    let result = team.members;
    if (posFilter)
      result = result.filter(
        (m) => m.user.position?.includes(posFilter) ?? false,
      );
    if (searchQ.trim()) {
      const q = searchQ.trim().toLowerCase();
      result = result.filter((m) => m.user.name.toLowerCase().includes(q));
    }
    return sortMembers(result, sort);
  }, [team, posFilter, searchQ, sort]);

  if (team.status === "loading") {
    return (
      <div className="flex flex-1 flex-col">
        <div className="px-4 pt-4">
          <div
            className="h-[42px] rounded-[12px] animate-pulse mb-3"
            style={{ background: "var(--ink-100)" }}
          />
          <div
            className="h-5 w-32 rounded animate-pulse mb-3"
            style={{ background: "var(--ink-100)" }}
          />
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: "1px solid var(--ink-100)" }}
          >
            <div
              className="w-[54px] h-[54px] rounded-full animate-pulse shrink-0"
              style={{ background: "var(--ink-100)" }}
            />
            <div className="flex-1">
              <div
                className="h-4 w-32 rounded animate-pulse mb-1.5"
                style={{ background: "var(--ink-100)" }}
              />
              <div
                className="h-3 w-24 rounded animate-pulse"
                style={{ background: "var(--ink-100)" }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (team.status !== "ready") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-[14px]" style={{ color: "var(--ink-400)" }}>
          Команда не найдена
        </p>
      </div>
    );
  }

  const countLabel = `${filtered.length} ${
    filtered.length === 1
      ? "игрок"
      : filtered.length >= 2 && filtered.length <= 4
        ? "игрока"
        : "игроков"
  }`;
  const filterActiveCount = posFilter ? 1 : 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="px-4 pt-4">
        <ListSearchBar
          value={searchQ}
          onChange={setSearchQ}
          placeholder="Поиск по имени"
          onFilterClick={() => setFilterOpen(true)}
          filterActiveCount={filterActiveCount}
        />
        <ListMeta
          countLabel={countLabel}
          sort={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-12 gap-2">
          <p className="text-[14px]" style={{ color: "var(--ink-400)" }}>
            {searchQ || posFilter ? "Никого не нашлось" : "Состав пуст"}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {filtered.map((m) => (
            <li key={m.id}>
              <PlayerListRow
                id={m.user.id}
                name={m.user.name}
                avatarUrl={m.user.avatar_url}
                position={m.user.position}
                city={m.user.city}
                rating={m.user.rating}
                roleBadge={m.role === "organizer" ? "Организатор" : undefined}
                onClick={() => setActivePlayer(m)}
              />
            </li>
          ))}
        </ul>
      )}

      {activePlayer && (
        <TeamPlayerSheet
          member={activePlayer}
          teamId={teamId}
          currentUserId={userId}
          isOrganizer={isOrganizer}
          onClose={() => setActivePlayer(null)}
          onActionDone={() => {
            setActivePlayer(null);
            reload?.();
          }}
        />
      )}

      <RosterFilterSheet
        open={filterOpen}
        position={posFilter}
        onClose={() => setFilterOpen(false)}
        onApply={(pos) => {
          setPosFilter(pos);
          setFilterOpen(false);
        }}
      />
    </div>
  );
}

function RosterFilterSheet({
  open,
  position,
  onClose,
  onApply,
}: {
  open: boolean;
  position: string;
  onClose: () => void;
  onApply: (pos: string) => void;
}) {
  const [draft, setDraft] = useState(position);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full pb-6 max-h-[70vh] flex flex-col"
        style={{
          background: "var(--card)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <span
            className="block w-9 h-1 rounded-full"
            style={{ background: "var(--ink-300)" }}
          />
        </div>
        <div className="flex items-center justify-between px-4 pt-1 pb-3 shrink-0">
          <h2
            className="text-[16px] font-bold"
            style={{ color: "var(--ink-900)" }}
          >
            Фильтры
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--ink-100)" }}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-4 flex flex-col gap-5 overflow-y-auto">
          <SheetChipGroup
            label="Позиция"
            options={POSITION_OPTIONS}
            value={draft}
            onChange={setDraft}
          />
        </div>

        <div className="flex gap-2 mt-5 px-4">
          <button
            type="button"
            onClick={() => setDraft("")}
            className="flex-1 h-11 rounded-[12px] text-[14px] font-semibold"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--ink-900)",
            }}
          >
            Сбросить
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-1 h-11 rounded-[12px] text-[14px] font-bold"
            style={{ background: "var(--green-700)", color: "white" }}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
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
