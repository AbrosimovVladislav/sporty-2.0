"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTeam, type TeamMember } from "../team-context";
import { useAuth } from "@/lib/auth-context";
import { SKILL_LEVELS } from "@/lib/catalogs";
import {
  ListSearchBar,
  ListMeta,
  FilterPills,
} from "@/components/ui";
import { PlayerListRow } from "@/components/players/PlayerListRow";
import { TeamPlayerSheet } from "@/components/team/TeamPlayerSheet";

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
                avatarUrl={m.user.avatar_url}
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
    </div>
  );
}
