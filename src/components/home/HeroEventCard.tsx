"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { formatCountdown, formatCountdownLabel, formatDayShort, formatPrice, formatTime } from "@/lib/format";

type Props = {
  event: {
    id: string;
    type: string;
    date: string;
    team_id: string;
    price_per_player: number;
    min_players: number;
    team: { id: string; name: string } | null;
    venue: { id: string; name: string } | null;
    yes_count: number;
    no_count: number;
    waiting_count: number;
    user_vote: "yes" | "no" | null;
  };
  userId: string;
  onVoteChange: (vote: "yes" | "no") => void;
  photoUrl?: string | null;
};

export function HeroEventCard({ event, userId, onVoteChange, photoUrl }: Props) {
  const router = useRouter();
  const [voting, setVoting] = useState(false);

  async function handleVote(vote: "yes" | "no") {
    if (voting) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/teams/${event.team_id}/events/${event.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, vote }),
      });
      if (res.ok) onVoteChange(vote);
    } finally {
      setVoting(false);
    }
  }

  const yes = event.yes_count;
  const no = event.no_count;
  const wait = event.waiting_count;
  const total = Math.max(1, yes + no + wait);

  return (
    <div
      className="rounded-[20px] overflow-hidden"
      style={{
        background: "var(--gray-900)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      }}
    >
      <Link href={`/team/${event.team_id}/events/${event.id}`} className="block">
        <div className="relative overflow-hidden">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt=""
              width={800}
              height={420}
              className="w-full h-[140px] object-cover"
              style={{ filter: "brightness(0.85) contrast(1.1)" }}
            />
          ) : (
            <div
              className="w-full h-[140px]"
              style={{ background: "linear-gradient(135deg, var(--gray-700), var(--gray-900))" }}
            />
          )}
          <div
            className="absolute left-0 right-0 bottom-0 h-20 pointer-events-none"
            style={{ background: "linear-gradient(transparent, var(--gray-900))" }}
          />
          <div className="absolute top-3 left-3.5 flex gap-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ background: "white", color: "var(--green-700)" }}
            >
              {EVENT_TYPE_LABEL[event.type] ?? event.type}
            </span>
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}
            >
              Запланировано
            </span>
          </div>
          <div className="absolute bottom-2.5 right-3.5 z-10 flex items-baseline gap-1">
            <span
              className="font-display text-[22px] font-bold leading-none text-white"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
            >
              {formatCountdown(event.date)}
            </span>
            <span
              className="text-[11px] text-white/70"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
            >
              {formatCountdownLabel(event.date)}
            </span>
          </div>
        </div>
      </Link>

      <div className="px-[18px] pt-4 pb-[18px]">
        <h2 className="font-display text-[22px] font-bold text-white uppercase leading-tight">
          {event.team?.name ?? "Команда"}
        </h2>

        <div className="flex gap-3.5 my-2.5 mb-3.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/45">
            <ClockIcon />
            {formatDayShort(event.date)} · {formatTime(event.date)}
          </div>
          {event.venue && (
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/45 min-w-0">
              <PinIcon />
              <span className="truncate">{event.venue.name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-white/45">
            <CoinIcon />
            <strong className="text-white font-bold">{formatPrice(event.price_per_player)}</strong>
          </div>
        </div>

        {/* Attendance bignum */}
        <div className="flex items-center gap-3.5 mb-3.5">
          <div className="font-display text-[28px] font-extrabold leading-none text-white">
            {yes}
            <span className="text-white/30 font-medium">/{event.min_players}</span>
          </div>
          <div className="flex-1">
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-1">
              {yes > 0 && (
                <div
                  className="rounded-full"
                  style={{ flex: yes, background: "var(--green-500)" }}
                />
              )}
              {no > 0 && (
                <div
                  className="rounded-full"
                  style={{ flex: no, background: "var(--danger)" }}
                />
              )}
              {wait > 0 && (
                <div
                  className="rounded-full"
                  style={{ flex: wait, background: "rgba(255,255,255,0.1)" }}
                />
              )}
              {yes + no + wait === 0 && (
                <div
                  className="rounded-full flex-1"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                />
              )}
            </div>
            <div className="flex gap-2.5 text-[10px] text-white/35">
              <span className="flex items-center gap-1">
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--green-500)" }} />
                <strong className="text-white/70 font-bold">{yes}</strong> да
              </span>
              <span className="flex items-center gap-1">
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--danger)" }} />
                <strong className="text-white/70 font-bold">{no}</strong> нет
              </span>
              <span className="flex items-center gap-1">
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
                <strong className="text-white/70 font-bold">{wait}</strong> ждём
              </span>
            </div>
          </div>
        </div>

        {/* RSVP */}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={voting}
            onClick={() => handleVote("yes")}
            className="flex-1 py-3 rounded-xl text-[15px] font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-1.5 disabled:opacity-60"
            style={
              event.user_vote === "yes"
                ? { background: "var(--green-500)", color: "white" }
                : { background: "transparent", color: "rgba(255,255,255,0.35)", border: "1.5px solid rgba(255,255,255,0.12)" }
            }
          >
            {event.user_vote === "yes" && (
              <span
                className="w-5 h-5 rounded-full inline-flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.3)" }}
              >
                <CheckIcon />
              </span>
            )}
            Приду
          </button>
          <button
            type="button"
            disabled={voting}
            onClick={() => handleVote("no")}
            className="flex-1 py-3 rounded-xl text-[15px] font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-1.5 disabled:opacity-60"
            style={
              event.user_vote === "no"
                ? { background: "var(--danger)", color: "white" }
                : { background: "transparent", color: "rgba(255,255,255,0.35)", border: "1.5px solid rgba(255,255,255,0.12)" }
            }
          >
            {event.user_vote === "no" && (
              <span
                className="w-5 h-5 rounded-full inline-flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.3)" }}
              >
                <CheckIcon />
              </span>
            )}
            Не приду
          </button>
        </div>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
