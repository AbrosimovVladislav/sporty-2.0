"use client";

import { useEffect } from "react";
import { Avatar } from "@/components/ui/Avatar";

type Attendance = {
  user_id: string;
  vote: "yes" | "no" | null;
  attended: boolean | null;
  paid: boolean | null;
  user: { id: string; name: string };
};

type Member = {
  id: string;
  user: { id: string; name: string };
};

type Props = {
  open: boolean;
  attendances: Attendance[];
  members: Member[];
  isOrganizer: boolean;
  isCompleted: boolean;
  currentUserId: string | null;
  onAttendedToggle?: (userId: string, attended: boolean) => void;
  onPaidToggle?: (userId: string, paid: boolean) => void;
  onClose: () => void;
};

export function EventAttendeesSheet({
  open,
  attendances,
  members,
  isOrganizer,
  isCompleted,
  currentUserId,
  onAttendedToggle,
  onPaidToggle,
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

  const attByUser = new Map(attendances.map((a) => [a.user_id, a]));
  const yesIds = new Set(attendances.filter((a) => a.vote === "yes").map((a) => a.user_id));
  const noIds = new Set(attendances.filter((a) => a.vote === "no").map((a) => a.user_id));

  const yesMembers = members.filter((m) => yesIds.has(m.user.id));
  const noMembers = members.filter((m) => noIds.has(m.user.id));
  const waitingMembers = members.filter(
    (m) => !yesIds.has(m.user.id) && !noIds.has(m.user.id),
  );

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
        <div className="px-5 pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--gray-200)" }} />
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
            label={`Идут (${yesMembers.length})`}
            dot="var(--green-500)"
            members={yesMembers}
            attByUser={attByUser}
            isOrganizer={isOrganizer}
            isCompleted={isCompleted}
            currentUserId={currentUserId}
            showAttendance
            onAttendedToggle={onAttendedToggle}
            onPaidToggle={onPaidToggle}
          />
          <Section
            label={`Не идут (${noMembers.length})`}
            dot="var(--danger)"
            members={noMembers}
            attByUser={attByUser}
            isOrganizer={isOrganizer}
            isCompleted={isCompleted}
            currentUserId={currentUserId}
            showAttendance={false}
            onAttendedToggle={onAttendedToggle}
            onPaidToggle={onPaidToggle}
          />
          <Section
            label={`Ждут ответа (${waitingMembers.length})`}
            dot="var(--gray-300)"
            members={waitingMembers}
            attByUser={attByUser}
            isOrganizer={isOrganizer}
            isCompleted={isCompleted}
            currentUserId={currentUserId}
            showAttendance={false}
            onAttendedToggle={onAttendedToggle}
            onPaidToggle={onPaidToggle}
          />
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  dot,
  members,
  attByUser,
  isOrganizer,
  isCompleted,
  currentUserId,
  showAttendance,
  onAttendedToggle,
  onPaidToggle,
}: {
  label: string;
  dot: string;
  members: Member[];
  attByUser: Map<string, Attendance>;
  isOrganizer: boolean;
  isCompleted: boolean;
  currentUserId: string | null;
  showAttendance: boolean;
  onAttendedToggle?: (userId: string, attended: boolean) => void;
  onPaidToggle?: (userId: string, paid: boolean) => void;
}) {
  if (members.length === 0) return null;

  return (
    <div className="mt-4 px-3">
      <p
        className="text-[11px] font-semibold uppercase mb-2 flex items-center gap-1.5"
        style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">
        {members.map((m) => {
          const att = attByUser.get(m.user.id);
          const isMe = currentUserId === m.user.id;
          const canEdit = isOrganizer || isMe;
          return (
            <li key={m.user.id} className="flex items-center gap-3 px-2 py-2">
              <Avatar name={m.user.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[14px] font-medium truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {m.user.name}
                  {isMe && (
                    <span
                      className="ml-1.5 text-[11px] font-semibold"
                      style={{ color: "var(--green-600)" }}
                    >
                      (вы)
                    </span>
                  )}
                </p>
              </div>
              {isCompleted && showAttendance && (
                <div className="flex gap-1.5 shrink-0">
                  <Toggle
                    label={att?.attended === true ? "Был" : att?.attended === false ? "Не был" : "Был?"}
                    active={att?.attended === true}
                    canEdit={canEdit && !!onAttendedToggle}
                    onClick={() =>
                      onAttendedToggle?.(m.user.id, !(att?.attended === true))
                    }
                  />
                  <Toggle
                    label={att?.paid === true ? "Сдал" : "Сдал?"}
                    active={att?.paid === true}
                    canEdit={canEdit && !!onPaidToggle}
                    onClick={() => onPaidToggle?.(m.user.id, !(att?.paid === true))}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Toggle({
  label,
  active,
  canEdit,
  onClick,
}: {
  label: string;
  active: boolean;
  canEdit: boolean;
  onClick: () => void;
}) {
  if (!canEdit) {
    return (
      <span
        className="text-[12px] px-2.5 py-1 rounded-full inline-block"
        style={
          active
            ? { background: "var(--green-50)", color: "var(--green-700)" }
            : { background: "var(--gray-100)", color: "var(--text-tertiary)" }
        }
      >
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[12px] font-semibold px-2.5 py-1 rounded-full transition-colors"
      style={
        active
          ? { background: "var(--green-500)", color: "white" }
          : { background: "var(--gray-100)", color: "var(--text-secondary)" }
      }
    >
      {label}
    </button>
  );
}
