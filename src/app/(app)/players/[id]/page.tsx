"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SkeletonCard, SkeletonList } from "@/components/Skeleton";
import BackButton from "@/components/BackButton";
import {
  Card,
  Button,
  Pill,
  Avatar,
  MiniStatCard,
  SectionEyebrow,
  BottomActionBar,
} from "@/components/ui";

type Player = {
  id: string;
  name: string;
  city: string | null;
  sport: string | null;
  position: string[] | null;
  skill_level: string | null;
  preferred_time: string | null;
  bio: string | null;
  birth_date: string | null;
  looking_for_team: boolean;
};

type Stats = {
  playedCount: number;
  votedYesCount: number;
  attendedCount: number;
  reliability: number | null;
  recentEvents: { event_id: string; type: string; date: string; vote: string | null; attended: boolean | null }[];
};

type OrgTeam = { id: string; name: string; sport: string; city: string };

const TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

function calcAge(birthDate: string): number | null {
  const d = new Date(birthDate);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const auth = useAuth();
  const currentUserId = auth.status === "authenticated" ? auth.user.id : null;

  const [player, setPlayer] = useState<Player | null | undefined>(undefined);
  const [stats, setStats] = useState<Stats | null>(null);
  const [orgTeams, setOrgTeams] = useState<OrgTeam[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/players/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/users/${id}/stats`).then((r) => (r.ok ? r.json() : null)),
    ]).then(([pd, sd]) => {
      setPlayer(pd?.player ?? null);
      setStats(sd ?? null);
    });
  }, [id]);

  useEffect(() => {
    if (!currentUserId) return;
    fetch(`/api/users/${currentUserId}/organizer-teams`)
      .then((r) => r.json())
      .then((d) => setOrgTeams(d.teams ?? []));
  }, [currentUserId]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function invite(teamId: string) {
    if (!currentUserId || inviting) return;
    setInviting(teamId);
    try {
      const res = await fetch(`/api/teams/${teamId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: id, inviter_id: currentUserId }),
      });
      if (res.ok) {
        showToast("Приглашение отправлено");
        setSheetOpen(false);
      } else {
        const d = await res.json();
        showToast(d.error === "Pending request already exists" ? "Приглашение уже отправлено" : "Ошибка");
      }
    } finally {
      setInviting(null);
    }
  }

  const isOwnProfile = currentUserId === id;
  const canInvite = !isOwnProfile && orgTeams !== null && orgTeams.length > 0;

  if (player === undefined) {
    return (
      <div className="flex flex-1 flex-col p-4 gap-4">
        <SkeletonCard className="h-28" />
        <SkeletonList count={2} />
      </div>
    );
  }

  if (player === null) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-foreground-secondary text-[15px]">Игрок не найден</p>
      </div>
    );
  }

  const age = player.birth_date ? calcAge(player.birth_date) : null;
  const locationParts = [player.city].filter(Boolean);

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pb-24">
        {/* Hero — light */}
        <div className="bg-background-card rounded-lg shadow-card px-4 pt-6 pb-5 relative">
          <BackButton
            fallbackHref="/players"
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-background-muted flex items-center justify-center text-foreground"
          />

          <Avatar size="xl" src={null} name={player.name} className="mx-auto" />

          <h1 className="text-[28px] font-bold text-foreground text-center leading-tight mt-3">
            {player.name}
          </h1>

          {locationParts.length > 0 && (
            <p className="text-[13px] text-foreground-secondary text-center mt-1">
              {locationParts.join(" · ")}
            </p>
          )}

          {player.looking_for_team && (
            <div className="flex justify-center mt-3">
              <Pill variant="role">Ищет команду</Pill>
            </div>
          )}
        </div>

        {/* О себе */}
        {(player.bio || (player.position && player.position.length > 0) || player.skill_level || age !== null || player.preferred_time) && (
          <Card>
            <SectionEyebrow tone="muted">О себе</SectionEyebrow>
            {player.bio && <p className="text-[15px] mb-3 leading-relaxed">{player.bio}</p>}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {player.position && player.position.length > 0 && (
                <div>
                  <p className="text-[13px] text-foreground-secondary">
                    {player.position.length > 1 ? "Позиции" : "Позиция"}
                  </p>
                  <p className="text-[15px] font-medium">{player.position.join(", ")}</p>
                </div>
              )}
              {player.skill_level && (
                <div>
                  <p className="text-[13px] text-foreground-secondary">Уровень</p>
                  <p className="text-[15px] font-medium">{player.skill_level}</p>
                </div>
              )}
              {age !== null && (
                <div>
                  <p className="text-[13px] text-foreground-secondary">Возраст</p>
                  <p className="text-[15px] font-medium">{age} лет</p>
                </div>
              )}
              {player.preferred_time && (
                <div>
                  <p className="text-[13px] text-foreground-secondary">Время</p>
                  <p className="text-[15px] font-medium">{player.preferred_time}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Статистика */}
        {stats && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <MiniStatCard label="Сыграно" value={stats.playedCount} />
              {stats.reliability !== null && (
                <MiniStatCard label="Надёжность" value={`${stats.reliability}%`} />
              )}
            </div>

            {stats.votedYesCount > 0 && (
              <p className="text-[13px] text-foreground-secondary -mt-1 px-1">
                Посетил {stats.attendedCount} из {stats.votedYesCount} записанных событий
              </p>
            )}

            {stats.recentEvents.length > 0 && (
              <div>
                <SectionEyebrow tone="muted">Последние события</SectionEyebrow>
                <Card padding="sm">
                  <ul className="divide-y divide-border">
                    {stats.recentEvents.map((e) => (
                      <li key={e.event_id} className="flex items-center justify-between px-1 py-3">
                        <div>
                          <p className="text-[15px] font-medium">{TYPE_LABEL[e.type] ?? e.type}</p>
                          <p className="text-[13px] text-foreground-secondary">
                            {new Date(e.date).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <Pill variant={e.attended ? "role" : "statusDanger"}>
                          {e.attended ? "Был" : "Не пришёл"}
                        </Pill>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Invite bottom bar */}
      {canInvite && (
        <BottomActionBar>
          <Button variant="primary" className="w-full" onClick={() => setSheetOpen(true)}>
            Пригласить в команду
          </Button>
        </BottomActionBar>
      )}

      {/* Bottom sheet — invite */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-background-overlay" onClick={() => setSheetOpen(false)} />
          <div className="relative bg-background-card rounded-t-xl p-5 flex flex-col gap-3 max-h-[70vh] overflow-y-auto shadow-pop">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-1" />
            <p className="text-[17px] font-semibold">Выбери команду</p>
            <ul className="flex flex-col gap-2">
              {orgTeams!.map((t) => (
                <li key={t.id}>
                  <button
                    disabled={!!inviting}
                    onClick={() => invite(t.id)}
                    className="w-full flex items-center justify-between bg-background rounded-lg px-4 py-3 text-left disabled:opacity-50 border border-border"
                  >
                    <div>
                      <p className="text-[15px] font-medium">{t.name}</p>
                      <p className="text-[13px] text-foreground-secondary mt-0.5">{t.city}</p>
                    </div>
                    {inviting === t.id && (
                      <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-foreground text-foreground-on-dark text-[14px] px-4 py-2 rounded-lg shadow-pop">
          {toast}
        </div>
      )}
    </>
  );
}
