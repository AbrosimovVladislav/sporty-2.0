"use client";

import Link from "next/link";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { formatDayShort, formatTime } from "@/lib/format";

type Props = {
  event: {
    id: string;
    type: string;
    date: string;
    team_id: string;
    team: { id: string; name: string } | null;
    venue: { id: string; name: string } | null;
    user_vote: "yes" | "no" | null;
  };
};

export function SchedulePreviewCard({ event }: Props) {
  const status = event.user_vote === "yes" ? "going" : event.user_vote === "no" ? "declined" : "pending";
  const [statusLabel, statusBg, statusColor] =
    status === "going"
      ? ["Иду", "var(--green-50)", "var(--green-600)"]
      : status === "declined"
        ? ["Не иду", "oklch(0.95 0.06 25)", "var(--danger)"]
        : ["Не ответил", "var(--gray-100)", "var(--gray-500)"];

  return (
    <Link
      href={`/team/${event.team_id}/events/${event.id}`}
      className="block mx-4 mb-2.5 rounded-2xl overflow-hidden transition-transform active:scale-[0.98]"
      style={{ border: "1.5px solid var(--gray-200)", background: "white" }}
    >
      <div className="relative h-20 overflow-hidden">
        <div
          className="w-full h-full"
          style={{
            background: "linear-gradient(135deg, var(--gray-700), var(--gray-900))",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)" }}
        />
        <div
          className="absolute bottom-2 left-3 font-display text-[16px] font-bold text-white uppercase"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
        >
          {formatDayShort(event.date)} · {formatTime(event.date)}
        </div>
        <div className="absolute top-2 right-2">
          <span
            className="text-[11px] font-semibold rounded-full px-2.5 py-1 inline-block"
            style={{ background: statusBg, color: statusColor }}
          >
            {statusLabel}
          </span>
        </div>
      </div>
      <div className="px-3.5 py-3">
        <div className="text-[15px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {event.team?.name ?? "Команда"}
        </div>
        <div className="text-[12px] truncate mt-0.5" style={{ color: "var(--text-secondary)" }}>
          {event.venue?.name ?? "Место не указано"} · {EVENT_TYPE_LABEL[event.type] ?? event.type}
        </div>
      </div>
    </Link>
  );
}
