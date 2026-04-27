"use client";

import { useState } from "react";

type Props = {
  isPastDue: boolean;
  onComplete: () => Promise<void>;
};

export function EventCompleteCTA({ isPastDue, onComplete }: Props) {
  const [busy, setBusy] = useState(false);

  async function handle() {
    setBusy(true);
    try {
      await onComplete();
    } finally {
      setBusy(false);
    }
  }

  if (isPastDue) {
    return (
      <section className="px-4 mt-5">
        <div
          className="rounded-2xl px-4 py-4 flex items-center gap-3"
          style={{
            background: "oklch(0.97 0.06 90)",
            border: "1.5px solid oklch(0.85 0.13 90)",
          }}
        >
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "white", color: "oklch(0.55 0.18 60)" }}
          >
            <ClockIcon />
          </span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[14px] font-semibold"
              style={{ color: "oklch(0.35 0.12 60)" }}
            >
              Событие прошло
            </p>
            <p className="text-[12px]" style={{ color: "oklch(0.45 0.1 60)" }}>
              Завершите, чтобы отметить кто был и сдал
            </p>
          </div>
          <button
            type="button"
            onClick={handle}
            disabled={busy}
            className="text-[13px] font-bold rounded-full px-4 py-2 shrink-0 disabled:opacity-50"
            style={{ background: "var(--green-500)", color: "white" }}
          >
            {busy ? "..." : "Завершить"}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 mt-5">
      <button
        type="button"
        onClick={handle}
        disabled={busy}
        className="w-full rounded-2xl px-4 py-3.5 flex items-center justify-between transition-transform active:scale-[0.99] disabled:opacity-50"
        style={{ background: "var(--green-500)", color: "white" }}
      >
        <div className="flex items-center gap-3 text-left">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <CheckIcon />
          </span>
          <div>
            <p className="text-[14px] font-bold">Завершить событие</p>
            <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.75)" }}>
              Yes-голосовавшие отметятся «был» автоматически
            </p>
          </div>
        </div>
        <ArrowIcon />
      </button>
    </section>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
