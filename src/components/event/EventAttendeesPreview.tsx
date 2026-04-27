"use client";

import { Avatar, AvatarStack } from "@/components/ui/Avatar";

type Attendee = {
  user_id: string;
  user: { id: string; name: string };
};

type Props = {
  yes: Attendee[];
  no: Attendee[];
  waiting: number;
  onOpen: () => void;
};

export function EventAttendeesPreview({ yes, no, waiting, onOpen }: Props) {
  const total = yes.length + no.length + waiting;

  return (
    <section className="px-4 mt-6">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-[11px] font-semibold uppercase"
          style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
        >
          Участники {total > 0 && `(${total})`}
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="text-[12px] font-medium"
          style={{ color: "var(--green-500)" }}
        >
          Все →
        </button>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-2xl px-4 py-3 flex items-center justify-between transition-transform active:scale-[0.98]"
        style={{
          background: "var(--bg-card)",
          border: "1.5px solid var(--gray-200)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {yes.length > 0 ? (
            <AvatarStack users={yes.map((a) => ({ id: a.user.id, name: a.user.name }))} max={5} size="sm" />
          ) : (
            <div className="w-8 h-8 rounded-full" style={{ background: "var(--gray-100)" }} />
          )}
          <div className="text-left min-w-0">
            <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {yes.length > 0 ? `${yes.length} ${plural(yes.length, "идёт", "идут", "идут")}` : "Пока никто не идёт"}
            </p>
            <p className="text-[12px] truncate" style={{ color: "var(--text-tertiary)" }}>
              {no.length > 0 && `${no.length} не ${plural(no.length, "придёт", "придут", "придут")} · `}
              {waiting} {plural(waiting, "ждёт ответа", "ждут ответа", "ждут ответа")}
            </p>
          </div>
        </div>
        <ChevronIcon />
      </button>
    </section>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const m = n % 10;
  const tens = n % 100;
  if (tens >= 11 && tens <= 14) return many;
  if (m === 1) return one;
  if (m >= 2 && m <= 4) return few;
  return many;
}

// re-export for sheet
export { Avatar };
