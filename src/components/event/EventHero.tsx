"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import {
  formatCountdown,
  formatCountdownLabel,
  formatFullDate,
  formatPrice,
} from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  planned: "Запланировано",
  completed: "Завершено",
  cancelled: "Отменено",
};

type Props = {
  teamId: string;
  eventId: string;
  userId: string | null;
  teamName: string;
  type: string;
  status: string;
  date: string;
  photoUrl: string | null;
  venueName: string | null;
  pricePerPlayer: number;
  userVote: "yes" | "no" | null;
  canVote: boolean;
  onVoted: () => void;
  onVenueClick?: () => void;
};

export function EventHero({
  teamId,
  eventId,
  userId,
  teamName,
  type,
  status,
  date,
  photoUrl,
  venueName,
  pricePerPlayer,
  userVote,
  canVote,
  onVoted,
  onVenueClick,
}: Props) {
  const router = useRouter();
  const [voting, setVoting] = useState(false);
  const isPlanned = status === "planned";

  async function handleVote(vote: "yes" | "no") {
    if (voting || !userId || !canVote) return;
    setVoting(true);
    try {
      const res = await fetch(
        `/api/teams/${teamId}/events/${eventId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, vote }),
        },
      );
      if (res.ok) onVoted();
    } finally {
      setVoting(false);
    }
  }

  const cd = formatCountdown(date);
  const cdLabel = formatCountdownLabel(date);
  const countdownText = cdLabel ? `${cd} ${cdLabel}` : cd;

  return (
    <div
      className="overflow-hidden"
      style={{
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        background: "var(--gray-900)",
      }}
    >
      <div className="relative h-[132px] w-full">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, var(--gray-700), var(--gray-900))" }}
          />
        )}

        {/* top dim for back/status legibility */}
        <div
          className="absolute inset-x-0 top-0 h-12 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)",
          }}
        />
        {/* bottom merge into the dark card — pulled higher for shorter hero */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 35%, var(--gray-900) 100%)",
          }}
        />

        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Назад"
          className="absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform active:scale-95"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <BackIcon />
        </button>

        <span
          className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.85)", color: "var(--gray-800)" }}
        >
          {STATUS_LABEL[status] ?? status}
        </span>

        {isPlanned && (
          <div
            className="absolute left-4 bottom-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.55)", color: "white" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--green-500)" }}
            />
            {countdownText}
          </div>
        )}
      </div>

      <div className="px-[18px] pt-1.5 pb-4">
        <button
          type="button"
          onClick={() => router.push(`/team/${teamId}`)}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider mb-1.5 transition-transform active:scale-[0.97]"
          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
        >
          <ShieldIcon />
          {teamName}
        </button>

        <h1 className="font-display text-[24px] font-bold uppercase leading-none text-white">
          {EVENT_TYPE_LABEL[type] ?? type}
        </h1>

        <p
          className="text-[13px] mt-1 capitalize"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {formatFullDate(date)}
        </p>

        <div className="flex gap-2 mt-2.5 flex-wrap">
          {venueName && (
            <Chip onClick={onVenueClick}>
              <PinIcon />
              <span className="truncate max-w-[160px]">{venueName}</span>
            </Chip>
          )}
          <Chip>
            <CoinIcon />
            <strong className="font-semibold text-white">{formatPrice(pricePerPlayer)}</strong>
          </Chip>
        </div>

        {canVote && isPlanned && userId && (
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              disabled={voting}
              onClick={() => handleVote("yes")}
              className="flex-1 py-2.5 rounded-[14px] text-[14px] font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={
                userVote === "yes"
                  ? { background: "var(--green-500)", color: "white" }
                  : {
                      background: "transparent",
                      color: "rgba(255,255,255,0.5)",
                      border: "1.5px solid rgba(255,255,255,0.15)",
                    }
              }
            >
              {userVote === "yes" && (
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
              className="flex-1 py-2.5 rounded-[14px] text-[14px] font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={
                userVote === "no"
                  ? { background: "var(--danger)", color: "white" }
                  : {
                      background: "transparent",
                      color: "rgba(255,255,255,0.5)",
                      border: "1.5px solid rgba(255,255,255,0.15)",
                    }
              }
            >
              {userVote === "no" && (
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
        )}
      </div>
    </div>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-transform active:scale-[0.97]"
      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)" }}
    >
      {children}
    </Tag>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function CoinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round">
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
