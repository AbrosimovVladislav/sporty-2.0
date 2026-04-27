"use client";

import Link from "next/link";
import { EVENT_TYPE_LABEL, SPORT_LABEL } from "@/lib/catalogs";
import { formatDayShort, formatTime, teamGradient } from "@/lib/format";

type Props = {
  team: {
    id: string;
    name: string;
    sport: string;
    city: string;
    role: "organizer" | "player";
    next_event: {
      id: string;
      type: string;
      date: string;
      yes_count: number;
      min_players: number;
    } | null;
    pending_requests: number;
    debtors: number;
  };
};

export function TeamPulseCard({ team }: Props) {
  const isOrg = team.role === "organizer";
  const next = team.next_event;
  const yesShort = next ? `${next.yes_count}/${next.min_players}` : "—";
  const attWarn = next ? next.yes_count < next.min_players : false;

  return (
    <Link
      href={`/team/${team.id}`}
      className="shrink-0 w-[210px] rounded-2xl overflow-hidden transition-transform active:scale-[0.97]"
      style={{ background: "white", border: "1.5px solid var(--gray-200)" }}
    >
      <div className="flex items-center gap-2.5 p-3.5 pb-0">
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 text-white"
          style={{ background: teamGradient(team.id) }}
        >
          <ShieldIcon />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold leading-tight truncate" style={{ color: "var(--text-primary)" }}>
            {team.name}
          </div>
          <div className="text-[11px] truncate" style={{ color: "var(--text-tertiary)" }}>
            {SPORT_LABEL[team.sport] ?? team.sport} · {team.city}
          </div>
        </div>
      </div>

      <div className="p-3.5 pt-3">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] mb-2.5"
          style={{ background: "var(--gray-100)" }}
        >
          {next ? (
            <>
              <ClockIcon color="var(--gray-600)" />
              <span className="text-[11px] font-medium truncate" style={{ color: "var(--gray-600)" }}>
                {EVENT_TYPE_LABEL[next.type] ?? next.type} · {formatDayShort(next.date)}, {formatTime(next.date)}
              </span>
            </>
          ) : (
            <>
              <DashIcon color="var(--gray-400)" />
              <span className="text-[11px] font-medium" style={{ color: "var(--gray-500)" }}>
                Нет событий
              </span>
            </>
          )}
        </div>

        <div className="flex">
          <div className="flex-1 text-center">
            <div
              className="text-[16px] font-extrabold leading-none tabular-nums"
              style={{ color: attWarn ? "var(--warning)" : "var(--text-primary)" }}
            >
              {yesShort}
            </div>
            <div className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
              Явка
            </div>
          </div>
          {isOrg && (
            <>
              <div className="flex-1 text-center relative" style={{ borderLeft: "1px solid var(--gray-200)" }}>
                <div
                  className="text-[16px] font-extrabold leading-none tabular-nums"
                  style={{ color: team.debtors > 0 ? "var(--danger)" : "var(--text-primary)" }}
                >
                  {team.debtors}
                </div>
                <div className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                  Долгов
                </div>
              </div>
              <div className="flex-1 text-center" style={{ borderLeft: "1px solid var(--gray-200)" }}>
                <div
                  className="text-[16px] font-extrabold leading-none tabular-nums"
                  style={{ color: team.pending_requests > 0 ? "var(--green-500)" : "var(--text-primary)" }}
                >
                  {team.pending_requests}
                </div>
                <div className="text-[10px] mt-1" style={{ color: "var(--text-tertiary)" }}>
                  Заявок
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function DashIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
