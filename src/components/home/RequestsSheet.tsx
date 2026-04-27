"use client";

import Link from "next/link";

type Props = {
  open: boolean;
  byTeam: { team_id: string; team_name: string; count: number }[];
  onClose: () => void;
};

export function RequestsSheet({ open, byTeam, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto"
        style={{ boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-[17px] font-semibold">Заявки в команды</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[24px] leading-none"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <ul className="px-2 pb-6">
          {byTeam.length === 0 ? (
            <li className="px-3 py-6 text-center text-[14px]" style={{ color: "var(--text-secondary)" }}>
              Нет заявок
            </li>
          ) : (
            byTeam.map((team) => (
              <li key={team.team_id}>
                <Link
                  href={`/team/${team.team_id}/roster?tab=requests`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl active:bg-gray-100"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "var(--green-50)" }}
                  >
                    <UserPlusIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold truncate">{team.team_name}</p>
                    <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                      {team.count} новых заявок
                    </p>
                  </div>
                  <div
                    className="min-w-[24px] h-6 rounded-full flex items-center justify-center px-2 text-[12px] font-bold text-white"
                    style={{ background: "var(--green-500)" }}
                  >
                    {team.count}
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function UserPlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  );
}
