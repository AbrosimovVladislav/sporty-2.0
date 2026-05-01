"use client";

import { pluralize } from "@/lib/format";

type Props = {
  total: number;
  byTeam: { team_id: string; team_name: string; count: number }[];
  onClick: () => void;
};

export function RequestsCard({ total, byTeam, onClick }: Props) {
  if (total === 0) return null;

  const summary = byTeam
    .slice(0, 3)
    .map((t) => `${t.team_name} · ${t.count}`)
    .join(", ");

  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-4 mt-4 w-[calc(100%-32px)] flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-transform active:scale-[0.98]"
      style={{ background: "white", border: "1.5px solid var(--gray-200)" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "var(--green-50)" }}
      >
        <UserPlusIcon />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
          {total} {pluralize(total, ["заявка", "заявки", "заявок"])} во вступление
        </div>
        <div className="text-[12px] truncate mt-px" style={{ color: "var(--text-secondary)" }}>
          {summary}
        </div>
      </div>
      <div
        className="min-w-[24px] h-6 rounded-full flex items-center justify-center px-2 text-[12px] font-bold text-white tabular-nums"
        style={{ background: "var(--green-500)" }}
      >
        {total}
      </div>
    </button>
  );
}

function UserPlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--green-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}
