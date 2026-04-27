"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  formatCountdown,
  formatCountdownLabel,
  formatFullDate,
  formatPrice,
  formatTime,
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
  status: string;
  date: string;
  photoUrl: string | null;
  venueName: string | null;
  pricePerPlayer: number;
  minPlayers: number;
  yesCount: number;
  noCount: number;
  waitingCount: number;
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
  status,
  date,
  photoUrl,
  venueName,
  pricePerPlayer,
  minPlayers,
  yesCount,
  noCount,
  waitingCount,
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
      <div className="relative h-[210px] w-full">
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
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0.55) 100%)",
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
      </div>

      <div className="px-[18px] pt-4 pb-5">
        {isPlanned && (
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium mb-3"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--green-500)" }}
            />
            {countdownText}
          </div>
        )}

        <h1 className="font-display text-[28px] font-bold uppercase leading-none text-white">
          {teamName}
        </h1>

        <p
          className="text-[13px] mt-1.5 capitalize"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          {formatFullDate(date)}
        </p>

        <div className="flex gap-2 mt-3 flex-wrap">
          <Chip>
            <ClockIcon />
            {formatTime(date)}
          </Chip>
          {venueName && (
            <Chip onClick={onVenueClick}>
              <PinIcon />
              <span className="truncate max-w-[140px]">{venueName}</span>
            </Chip>
          )}
          <Chip>
            <CoinIcon />
            <strong className="font-semibold text-white">{formatPrice(pricePerPlayer)}</strong>
          </Chip>
        </div>

        <div className="flex items-center gap-3.5 mt-4 mb-4">
          <div className="font-display text-[32px] font-extrabold leading-none text-white">
            {yesCount}
            <span className="text-white/30 font-medium">/{minPlayers}</span>
          </div>
          <div className="flex-1">
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-1.5">
              {yesCount > 0 && (
                <div
                  className="rounded-full"
                  style={{ flex: yesCount, background: "var(--green-500)" }}
                />
              )}
              {noCount > 0 && (
                <div
                  className="rounded-full"
                  style={{ flex: noCount, background: "var(--danger)" }}
                />
              )}
              {waitingCount > 0 && (
                <div
                  className="rounded-full"
                  style={{ flex: waitingCount, background: "rgba(255,255,255,0.1)" }}
                />
              )}
              {yesCount + noCount + waitingCount === 0 && (
                <div
                  className="rounded-full flex-1"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                />
              )}
            </div>
            <div className="flex gap-2.5 text-[10px] text-white/40">
              <span className="flex items-center gap-1">
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--green-500)" }} />
                <strong className="text-white/75 font-bold">{yesCount}</strong> да
              </span>
              <span className="flex items-center gap-1">
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--danger)" }} />
                <strong className="text-white/75 font-bold">{noCount}</strong> нет
              </span>
              <span className="flex items-center gap-1">
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
                <strong className="text-white/75 font-bold">{waitingCount}</strong> ждём
              </span>
            </div>
          </div>
        </div>

        {canVote && isPlanned && userId && (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={voting}
              onClick={() => handleVote("yes")}
              className="flex-1 py-3.5 rounded-xl text-[15px] font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-1.5 disabled:opacity-60"
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
              className="flex-1 py-3.5 rounded-xl text-[15px] font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-1.5 disabled:opacity-60"
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
function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
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
