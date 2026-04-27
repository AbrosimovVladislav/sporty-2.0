"use client";

import { useState } from "react";

type Props = {
  teamId: string;
  eventId: string;
  userId: string;
  currentVote: "yes" | "no" | null;
  yesCount: number;
  minPlayers: number;
  onVoted: (vote: "yes" | "no") => void;
  disabled?: boolean;
};

export function EventRSVP({
  teamId,
  eventId,
  userId,
  currentVote,
  yesCount,
  minPlayers,
  onVoted,
  disabled,
}: Props) {
  const [voting, setVoting] = useState(false);

  async function handleVote(vote: "yes" | "no") {
    if (voting || disabled) return;
    setVoting(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/events/${eventId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, vote }),
      });
      if (res.ok) onVoted(vote);
    } finally {
      setVoting(false);
    }
  }

  const isYes = currentVote === "yes";
  const isNo = currentVote === "no";

  return (
    <section className="px-4 mt-5">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={voting || disabled}
          onClick={() => handleVote("yes")}
          className="flex-1 py-3.5 rounded-xl text-[15px] font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-1.5 disabled:opacity-60"
          style={
            isYes
              ? { background: "var(--green-500)", color: "white" }
              : {
                  background: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  border: "1.5px solid var(--gray-200)",
                }
          }
        >
          {isYes && (
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
          disabled={voting || disabled}
          onClick={() => handleVote("no")}
          className="flex-1 py-3.5 rounded-xl text-[15px] font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-1.5 disabled:opacity-60"
          style={
            isNo
              ? { background: "var(--danger)", color: "white" }
              : {
                  background: "var(--bg-secondary)",
                  color: "var(--text-secondary)",
                  border: "1.5px solid var(--gray-200)",
                }
          }
        >
          {isNo && (
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
      <p
        className="text-[12px] mt-2 text-center"
        style={{ color: "var(--text-tertiary)" }}
      >
        {yesCount} / {minPlayers} идут
        {currentVote === null && " · вы ещё не ответили"}
      </p>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
