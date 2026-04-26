"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PlayerCard, type OrgAction } from "@/components/PlayerCard";
import { useTeam, type TeamMember } from "../team-context";
import { SkeletonList } from "@/components/Skeleton";
import { Avatar } from "@/components/ui/Avatar";
import { StatCard, MiniStatCard } from "@/components/ui/StatCard";
import { Pill } from "@/components/ui/Pill";
import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { EmptyState } from "@/components/ui/EmptyState";
import { MiniBar } from "@/components/ui/MiniBar";
import { Card } from "@/components/ui/Card";
import { UsersIcon } from "@/components/Icons";
import { SKILL_LEVELS } from "@/lib/catalogs";

const POSITION_FILTERS = ["Все", "Вратари", "Защитники", "Полузащ.", "Нападающие", "Универсалы"];

const POSITION_MAP: Record<string, string> = {
  "Вратари": "Вратарь",
  "Защитники": "Защитник",
  "Полузащ.": "Полузащитник",
  "Нападающие": "Нападающий",
  "Универсалы": "Универсал",
};


function skillToLevel(skill: string | null): number {
  if (!skill) return 0;
  const idx = (SKILL_LEVELS as readonly string[]).indexOf(skill);
  return idx >= 0 ? idx + 1 : 0;
}

type OpenMember = {
  userId: string;
  memberId: string;
  isSelf: boolean;
  canPromote: boolean;
  canRemove: boolean;
};

export default function RosterPage() {
  const team = useTeam();
  const auth = useAuth();
  const router = useRouter();
  const [posFilter, setPosFilter] = useState("Все");
  const [openMember, setOpenMember] = useState<OpenMember | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const userId = auth.status === "authenticated" ? auth.user.id : null;

  if (team.status === "loading") return <SkeletonList count={4} />;
  if (team.status !== "ready") return null;

  const teamId = team.team.id;
  const reload = team.reload;
  const organizers = team.members.filter((m) => m.role === "organizer");
  const players = team.members.filter((m) => m.role === "player");
  const isOrganizer = team.role === "organizer";

  const totalCount = team.members.length;
  const goalkeeperCount = team.members.filter((m) => m.user.position === "Вратарь").length;
  const noPositionCount = players.filter((m) => !m.user.position).length;

  const filteredPlayers =
    posFilter === "Все"
      ? players
      : players.filter((m) => m.user.position === POSITION_MAP[posFilter]);

  function openPlayerCard(member: TeamMember) {
    if (!userId) return;
    const isSelf = member.user.id === userId;
    setOpenMember({
      userId: member.user.id,
      memberId: member.id,
      isSelf,
      canPromote: isOrganizer && !isSelf && member.role === "player",
      canRemove: isOrganizer && !(isSelf && organizers.length <= 1),
    });
  }

  async function handlePromote(memberId: string) {
    if (!userId || processing) return;
    setProcessing(memberId);
    try {
      await fetch(`/api/teams/${teamId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      setOpenMember(null);
      reload();
    } finally {
      setProcessing(null);
    }
  }

  async function handleRemove(memberId: string) {
    if (!userId || processing) return;
    setProcessing(memberId);
    try {
      await fetch(`/api/teams/${teamId}/members/${memberId}?userId=${userId}`, {
        method: "DELETE",
      });
      setOpenMember(null);
      reload();
    } finally {
      setProcessing(null);
    }
  }

  if (team.members.length === 0) {
    return (
      <EmptyState
        icon={<UsersIcon />}
        text="В команде пока никого нет"
        action={
          isOrganizer
            ? { label: "Найти игроков", onClick: () => router.push("/players") }
            : undefined
        }
      />
    );
  }

  return (
    <>
      {/* Summary stats */}
      <StatCard value={totalCount} label="Состав команды" />
      <div className="grid grid-cols-2 gap-3">
        <MiniStatCard
          value={goalkeeperCount}
          label="вратарей"
          color={goalkeeperCount === 0 ? "danger" : "default"}
        />
        <MiniStatCard
          value={noPositionCount}
          label="без позиции"
          color={noPositionCount > 0 ? "warning" : "default"}
        />
      </div>

      {/* Position filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {POSITION_FILTERS.map((pos) => (
          <Pill
            key={pos}
            variant={posFilter === pos ? "filterActive" : "filter"}
            onClick={() => setPosFilter(pos)}
            className="shrink-0"
          >
            {pos}
          </Pill>
        ))}
      </div>

      {/* Organizers group */}
      {organizers.length > 0 && (
        <section>
          <SectionEyebrow tone="primary" className="mb-2">
            ОРГАНИЗАТОРЫ · {organizers.length}
          </SectionEyebrow>
          <Card padding="sm">
            <ul className="divide-y divide-border">
              {organizers.map((m) => (
                <MemberRow key={m.id} member={m} onClick={() => openPlayerCard(m)} />
              ))}
            </ul>
          </Card>
        </section>
      )}

      {/* Players group */}
      {players.length > 0 && (
        <section>
          <SectionEyebrow tone="muted" className="mb-2">
            ИГРОКИ · {filteredPlayers.length}
            {posFilter !== "Все" ? ` / ${players.length}` : ""}
          </SectionEyebrow>
          {filteredPlayers.length > 0 ? (
            <Card padding="sm">
              <ul className="divide-y divide-border">
                {filteredPlayers.map((m) => (
                  <MemberRow key={m.id} member={m} onClick={() => openPlayerCard(m)} />
                ))}
              </ul>
            </Card>
          ) : (
            <p className="text-[14px] text-foreground-secondary text-center py-4">
              Нет игроков с этой позицией
            </p>
          )}
        </section>
      )}

      {/* PlayerCard bottom sheet */}
      {userId && openMember && (
        <PlayerCard
          teamId={teamId}
          requesterId={userId}
          targetUserId={openMember.userId}
          onClose={() => setOpenMember(null)}
          organizerActions={
            isOrganizer && !openMember.isSelf
              ? ([
                  openMember.canPromote && {
                    label: "Сделать организатором",
                    variant: "secondary" as const,
                    loading: processing === openMember.memberId,
                    onClick: () => handlePromote(openMember.memberId),
                  },
                  openMember.canRemove && {
                    label: "Удалить из команды",
                    variant: "danger" as const,
                    loading: processing === openMember.memberId,
                    onClick: () => handleRemove(openMember.memberId),
                  },
                ].filter(Boolean) as OrgAction[])
              : undefined
          }
        />
      )}
    </>
  );
}

function MemberRow({ member, onClick }: { member: TeamMember; onClick: () => void }) {
  const level = skillToLevel(member.user.skill_level);

  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 py-3 px-1 min-h-[56px] text-left"
      >
        <Avatar name={member.user.name} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold truncate">{member.user.name}</p>
          <p className="text-[13px] text-foreground-secondary truncate">
            {member.user.position ?? "Позиция не указана"}
          </p>
        </div>
        {level > 0 && <MiniBar value={level} max={5} />}
      </button>
    </li>
  );
}
