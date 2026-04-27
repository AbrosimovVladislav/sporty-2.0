"use client";

import { useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";

type Attendance = {
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  user: { id: string; name: string };
};

type Props = {
  open: boolean;
  attendances: Attendance[];
  totalMembers: number;
  isOrganizer: boolean;
  isCompleted: boolean;
  onAttendedToggle?: (userId: string, attended: boolean) => void;
  onClose: () => void;
};

export function EventAttendeesSheet({
  open,
  attendances,
  totalMembers,
  isOrganizer,
  isCompleted,
  onAttendedToggle,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open]);

  if (!open) return null;

  const yes = attendances.filter((a) => a.vote === "yes");
  const no = attendances.filter((a) => a.vote === "no");
  const respondedIds = new Set(attendances.filter((a) => a.vote !== null).map((a) => a.user_id));
  const waitingCount = Math.max(0, totalMembers - respondedIds.size);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
        style={{ boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-3 pb-2 flex items-center justify-between">
          <div className="flex-1 flex justify-center">
            <div className="w-10 h-1 rounded-full" style={{ background: "var(--gray-200)" }} />
          </div>
        </div>
        <div className="px-5 pb-3 flex items-center justify-between">
          <h3 className="text-[18px] font-bold">Участники</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[24px] leading-none w-8 h-8 flex items-center justify-center"
            style={{ color: "var(--text-secondary)" }}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className="px-3 pb-6">
          <Section
            label={`Идут (${yes.length})`}
            tone="yes"
            attendances={yes}
            isOrganizer={isOrganizer}
            isCompleted={isCompleted}
            onAttendedToggle={onAttendedToggle}
          />
          <Section
            label={`Не идут (${no.length})`}
            tone="no"
            attendances={no}
            isOrganizer={isOrganizer}
            isCompleted={isCompleted}
          />
          {waitingCount > 0 && (
            <div className="mt-4 px-3">
              <p
                className="text-[11px] font-semibold uppercase mb-2"
                style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
              >
                Ждём ответа ({waitingCount})
              </p>
              <p className="text-[14px]" style={{ color: "var(--text-tertiary)" }}>
                {waitingCount} {plural(waitingCount, "игрок ещё не ответил", "игрока ещё не ответили", "игроков ещё не ответили")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  tone,
  attendances,
  isOrganizer,
  isCompleted,
  onAttendedToggle,
}: {
  label: string;
  tone: "yes" | "no";
  attendances: Attendance[];
  isOrganizer: boolean;
  isCompleted: boolean;
  onAttendedToggle?: (userId: string, attended: boolean) => void;
}) {
  if (attendances.length === 0) return null;
  const dotColor = tone === "yes" ? "var(--green-500)" : "var(--danger)";

  return (
    <div className="mt-4 px-3">
      <p
        className="text-[11px] font-semibold uppercase mb-2 flex items-center gap-1.5"
        style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">
        {attendances.map((a) => (
          <li key={a.user_id} className="flex items-center gap-3 px-2 py-2">
            <Avatar name={a.user.name} size="sm" />
            <p className="flex-1 text-[14px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
              {a.user.name}
            </p>
            {isCompleted && tone === "yes" && (
              isOrganizer && onAttendedToggle ? (
                <button
                  type="button"
                  onClick={() => onAttendedToggle(a.user_id, !(a.attended === true))}
                  className="text-[12px] font-semibold px-3 py-1 rounded-full"
                  style={
                    a.attended === true
                      ? { background: "var(--green-500)", color: "white" }
                      : { background: "var(--gray-100)", color: "var(--text-secondary)" }
                  }
                >
                  {a.attended === true ? "Был" : "Был?"}
                </button>
              ) : (
                a.attended !== null && (
                  <span
                    className="text-[12px] px-3 py-1 rounded-full"
                    style={
                      a.attended
                        ? { background: "var(--green-50)", color: "var(--green-700)" }
                        : { background: "var(--gray-100)", color: "var(--text-tertiary)" }
                    }
                  >
                    {a.attended ? "Был" : "Не был"}
                  </span>
                )
              )
            )}
          </li>
        ))}
      </ul>
    </div>
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
