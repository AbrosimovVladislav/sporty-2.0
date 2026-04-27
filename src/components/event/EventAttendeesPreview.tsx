"use client";

import { AvatarStack } from "@/components/ui/Avatar";

type Attendee = {
  user_id: string;
  user: { id: string; name: string };
};

type Props = {
  yes: Attendee[];
  no: Attendee[];
  waiting: number;
  minPlayers: number;
  onOpen: () => void;
};

export function EventAttendeesPreview({ yes, no, waiting, minPlayers, onOpen }: Props) {
  const yesCount = yes.length;
  const noCount = no.length;

  return (
    <section className="px-4 mt-6">
      <p
        className="text-[11px] font-semibold uppercase mb-2 px-1"
        style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
      >
        Участники
      </p>

      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-2xl px-4 py-4 transition-transform active:scale-[0.99] text-left"
        style={{ background: "var(--bg-card)", border: "1.5px solid var(--gray-200)" }}
      >
        <div className="flex items-center gap-3.5 mb-3">
          <div
            className="font-display text-[32px] font-extrabold leading-none"
            style={{ color: "var(--text-primary)" }}
          >
            {yesCount}
            <span className="font-medium" style={{ color: "var(--text-tertiary)" }}>
              /{minPlayers}
            </span>
          </div>
          <div className="flex-1">
            <div
              className="flex h-2 rounded-full overflow-hidden gap-0.5 mb-1.5"
              style={{ background: "var(--gray-100)" }}
            >
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
              {waiting > 0 && (
                <div
                  className="rounded-full"
                  style={{ flex: waiting, background: "var(--gray-200)" }}
                />
              )}
            </div>
            <div className="flex gap-2.5 text-[10px]">
              <span className="flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--green-500)" }} />
                <strong className="font-bold" style={{ color: "var(--text-secondary)" }}>{yesCount}</strong> да
              </span>
              <span className="flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--danger)" }} />
                <strong className="font-bold" style={{ color: "var(--text-secondary)" }}>{noCount}</strong> нет
              </span>
              <span className="flex items-center gap-1" style={{ color: "var(--text-tertiary)" }}>
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: "var(--gray-300)" }} />
                <strong className="font-bold" style={{ color: "var(--text-secondary)" }}>{waiting}</strong> ждём
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid var(--gray-100)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {yesCount > 0 ? (
              <AvatarStack
                users={yes.map((a) => ({ id: a.user.id, name: a.user.name }))}
                max={5}
                size="sm"
              />
            ) : (
              <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                Пока никто не отметился
              </span>
            )}
          </div>
          <span
            className="inline-flex items-center gap-1 text-[12px] font-semibold shrink-0"
            style={{ color: "var(--green-600)" }}
          >
            Все участники
            <ChevronIcon />
          </span>
        </div>
      </button>
    </section>
  );
}

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
