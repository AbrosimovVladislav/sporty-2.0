"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PlayerCard } from "@/components/PlayerCard";
import { useTeam, type TeamMember } from "../team-context";
import { SkeletonList } from "@/components/Skeleton";

export default function RosterPage() {
  const team = useTeam();
  const auth = useAuth();
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);

  const requesterId = auth.status === "authenticated" ? auth.user.id : null;

  if (team.status === "loading") {
    return <SkeletonList count={4} />;
  }

  if (team.status !== "ready") {
    return null;
  }

  const organizers = team.members.filter((m) => m.role === "organizer");
  const players = team.members.filter((m) => m.role === "player");
  const isOrganizer = team.role === "organizer";

  if (team.members.length === 0) {
    return (
      <section className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
        В команде пока никого нет
      </section>
    );
  }

  return (
    <>
      {organizers.length > 0 && (
        <RosterGroup
          title="Организаторы"
          items={organizers}
          teamId={team.team.id}
          isOrganizer={isOrganizer}
          showPromote={false}
          showRemove={isOrganizer && organizers.length > 1}
          onChanged={team.reload}
          onOpenPlayer={isOrganizer ? setOpenPlayerId : null}
        />
      )}
      {players.length > 0 && (
        <RosterGroup
          title="Игроки"
          items={players}
          teamId={team.team.id}
          isOrganizer={isOrganizer}
          showPromote={isOrganizer}
          showRemove={isOrganizer}
          onChanged={team.reload}
          onOpenPlayer={isOrganizer ? setOpenPlayerId : null}
        />
      )}
      {requesterId && openPlayerId && (
        <PlayerCard
          teamId={team.team.id}
          requesterId={requesterId}
          targetUserId={openPlayerId}
          onClose={() => setOpenPlayerId(null)}
        />
      )}
    </>
  );
}

function RosterGroup({
  title,
  items,
  teamId,
  isOrganizer,
  showPromote,
  showRemove,
  onChanged,
  onOpenPlayer,
}: {
  title: string;
  items: TeamMember[];
  teamId: string;
  isOrganizer: boolean;
  showPromote: boolean;
  showRemove: boolean;
  onChanged: () => void;
  onOpenPlayer: ((userId: string) => void) | null;
}) {
  return (
    <section>
      <p className="text-xs uppercase font-display text-foreground-secondary mb-2">{title}</p>
      <ul className="flex flex-col gap-2">
        {items.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            teamId={teamId}
            isOrganizer={isOrganizer}
            showPromote={showPromote}
            showRemove={showRemove}
            onChanged={onChanged}
            onOpenPlayer={onOpenPlayer}
          />
        ))}
      </ul>
    </section>
  );
}

function MemberRow({
  member,
  teamId,
  isOrganizer,
  showPromote,
  showRemove,
  onChanged,
  onOpenPlayer,
}: {
  member: TeamMember;
  teamId: string;
  isOrganizer: boolean;
  showPromote: boolean;
  showRemove: boolean;
  onChanged: () => void;
  onOpenPlayer: ((userId: string) => void) | null;
}) {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const [processing, setProcessing] = useState(false);

  const isSelf = member.user.id === userId;

  async function handlePromote() {
    if (!userId || processing) return;
    setProcessing(true);
    try {
      await fetch(`/api/teams/${teamId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      onChanged();
    } finally {
      setProcessing(false);
    }
  }

  async function handleRemove() {
    if (!userId || processing) return;
    setProcessing(true);
    try {
      await fetch(`/api/teams/${teamId}/members/${member.id}?userId=${userId}`, {
        method: "DELETE",
      });
      onChanged();
    } finally {
      setProcessing(false);
    }
  }

  const canOpenCard = onOpenPlayer !== null;

  return (
    <li className="bg-background-card border border-border rounded-lg px-4 py-3">
      <div className="flex items-center justify-between">
        {canOpenCard ? (
          <button
            onClick={() => onOpenPlayer!(member.user.id)}
            className="text-left flex-1"
          >
            <span className="font-medium">{member.user.name}</span>
            {member.user.city && (
              <span className="text-xs text-foreground-secondary ml-2">{member.user.city}</span>
            )}
          </button>
        ) : (
          <div>
            <span className="font-medium">{member.user.name}</span>
            {member.user.city && (
              <span className="text-xs text-foreground-secondary ml-2">{member.user.city}</span>
            )}
          </div>
        )}
        {isOrganizer && !isSelf && (showPromote || showRemove) && (
          <div className="flex gap-2">
            {showPromote && (
              <button
                onClick={handlePromote}
                disabled={processing}
                className="text-xs font-display font-semibold uppercase px-3 py-1.5 rounded-full bg-primary/10 text-primary disabled:opacity-50"
              >
                Организатор
              </button>
            )}
            {showRemove && (
              <button
                onClick={handleRemove}
                disabled={processing}
                className="text-xs font-display font-semibold uppercase px-3 py-1.5 rounded-full border border-border text-foreground-secondary disabled:opacity-50"
              >
                Удалить
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
