"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { teamGradient } from "@/lib/format";
import { setLastActiveTeamId } from "@/lib/lastActiveTeam";

type MyTeam = {
  id: string;
  name: string;
  sport: string;
  city: string;
  role: "organizer" | "player";
  logo_url: string | null;
};

type Props = {
  open: boolean;
  currentTeamId: string;
  onClose: () => void;
};

export function TeamSwitcherSheet({ open, currentTeamId, onClose }: Props) {
  const auth = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<MyTeam[] | null>(null);

  useEffect(() => {
    if (!open) return;
    if (auth.status !== "authenticated") {
      setTeams([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/users/${auth.user.id}/teams`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setTeams((d.teams ?? []) as MyTeam[]);
      })
      .catch(() => {
        if (!cancelled) setTeams([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, auth]);

  if (!open) return null;

  function selectTeam(id: string) {
    setLastActiveTeamId(id);
    onClose();
    if (id !== currentTeamId) {
      router.push(`/team/${id}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative bg-white p-5 max-h-[75vh] overflow-y-auto"
        style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
      >
        <div
          className="w-10 h-1 rounded-full mx-auto mb-4"
          style={{ background: "var(--gray-300)" }}
        />
        <h2
          className="text-[18px] font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Мои команды
        </h2>

        {teams === null ? (
          <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
            Загружаем…
          </p>
        ) : (
          <ul className="flex flex-col">
            {teams.map((t) => {
              const active = t.id === currentTeamId;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => selectTeam(t.id)}
                    className="w-full flex items-center gap-3.5 py-3 text-left transition-colors active:bg-bg-secondary"
                    style={{ borderBottom: "1px solid var(--gray-100)" }}
                  >
                    <TeamLogo team={t} />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[15px] font-semibold truncate"
                        style={{
                          color: active
                            ? "var(--green-700)"
                            : "var(--text-primary)",
                        }}
                      >
                        {t.name}
                      </p>
                      <p
                        className="text-[12px] truncate mt-0.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {t.role === "organizer" ? "Капитан" : "Игрок"} · {t.city}
                      </p>
                    </div>
                    {active && (
                      <span
                        className="text-[11px] font-semibold uppercase tabular-nums shrink-0"
                        style={{
                          letterSpacing: "0.06em",
                          color: "var(--green-700)",
                        }}
                      >
                        Сейчас
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          href="/teams/create"
          onClick={onClose}
          className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-[14px] text-[14px] font-semibold"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1.5px solid var(--gray-200)",
          }}
        >
          <PlusIcon />
          <span>Создать команду</span>
        </Link>
      </div>
    </div>
  );
}

function TeamLogo({ team }: { team: MyTeam }) {
  const initial = team.name.trim().charAt(0).toUpperCase() || "?";
  if (team.logo_url) {
    return (
      <div
        className="w-11 h-11 rounded-full overflow-hidden shrink-0"
        style={{ background: "white" }}
      >
        <Image
          src={team.logo_url}
          alt=""
          width={44}
          height={44}
          sizes="44px"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
      style={{ background: teamGradient(team.id) }}
    >
      <span className="font-display text-[18px] font-bold text-white leading-none">
        {initial}
      </span>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
