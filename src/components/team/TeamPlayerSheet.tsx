"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Accordion } from "./team-player-sheet/Accordion";
import { Empty, SkeletonRow, skillToNum } from "./team-player-sheet/atoms";
import {
  FinancesBody,
  peekFinances,
} from "./team-player-sheet/FinancesBody";
import { CloseIcon } from "./team-player-sheet/icons";
import {
  ReliabilityBody,
  peekReliability,
} from "./team-player-sheet/ReliabilityBody";
import { SheetHeader } from "./team-player-sheet/SheetHeader";
import type {
  FinancesData,
  ReliabilityData,
  TeamPlayerSheetMember,
} from "./team-player-sheet/types";

export type { TeamPlayerSheetMember } from "./team-player-sheet/types";

type Props = {
  member: TeamPlayerSheetMember;
  teamId: string;
  currentUserId: string | null;
  isOrganizer: boolean;
  initialSection?: "reliability" | "finances" | "stats";
  onClose: () => void;
  onActionDone: () => void;
};

type Section = "reliability" | "finances" | "stats" | null;

export function TeamPlayerSheet({
  member,
  teamId,
  currentUserId,
  isOrganizer,
  initialSection,
  onClose,
  onActionDone,
}: Props) {
  const router = useRouter();
  const [openSection, setOpenSection] = useState<Section>(initialSection ?? null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const [reliability, setReliability] = useState<
    ReliabilityData | null | undefined
  >(undefined);
  const [finances, setFinances] = useState<FinancesData | null | undefined>(
    undefined,
  );

  const isSelf = member.user.id === currentUserId;
  const isTargetOrganizer = member.role === "organizer";
  const canSeeFinances = isOrganizer || isSelf;

  const skillNum = skillToNum(member.user.skill_level);

  useEffect(() => {
    if (!currentUserId) {
      setReliability(null);
      return;
    }
    fetch(
      `/api/teams/${teamId}/members/${member.user.id}/reliability?userId=${currentUserId}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setReliability(d))
      .catch(() => setReliability(null));
  }, [currentUserId, teamId, member.user.id]);

  useEffect(() => {
    if (!currentUserId || !canSeeFinances) {
      setFinances(null);
      return;
    }
    fetch(
      `/api/teams/${teamId}/members/${member.user.id}/finances?userId=${currentUserId}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setFinances(d))
      .catch(() => setFinances(null));
  }, [currentUserId, teamId, member.user.id, canSeeFinances]);

  function toggleSection(s: Exclude<Section, null>) {
    setOpenSection((cur) => (cur === s ? null : s));
  }

  function navigateToEvent(eventId: string) {
    router.push(`/team/${teamId}/events/${eventId}`);
  }

  async function handlePromote() {
    if (!currentUserId || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      if (res.ok) onActionDone();
      else {
        const data = await res.json();
        setActionError(data.error ?? "Ошибка");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!currentUserId || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/teams/${teamId}/members/${member.id}?userId=${currentUserId}`,
        { method: "DELETE" },
      );
      if (res.ok) onActionDone();
      else {
        const data = await res.json();
        setActionError(data.error ?? "Ошибка");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!currentUserId || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/teams/${teamId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      });
      if (res.ok) router.replace("/home");
      else {
        const data = await res.json();
        setActionError(data.error ?? "Ошибка");
        setConfirmLeave(false);
      }
    } finally {
      setBusy(false);
    }
  }

  const reliabilityPeek = peekReliability(reliability);
  const financesPeek = peekFinances(finances);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full bg-white pb-8 max-h-[88vh] overflow-y-auto"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span
            className="block w-9 h-1 rounded-full"
            style={{ background: "var(--gray-300)" }}
          />
        </div>
        <div className="flex items-center justify-end px-4 pt-1 pb-2">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--gray-100)" }}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="px-4 flex flex-col gap-3">
          <SheetHeader
            member={member}
            isTargetOrganizer={isTargetOrganizer}
            skillNum={skillNum}
            onOpenProfile={() => router.push(`/players/${member.user.id}`)}
          />

          <Accordion
            label="Надёжность · в этой команде"
            open={openSection === "reliability"}
            onToggle={() => toggleSection("reliability")}
            peek={reliabilityPeek}
          >
            {reliability === undefined ? (
              <SkeletonRow />
            ) : reliability === null ||
              reliability.totals.votedYes + reliability.totals.cancelled === 0 ? (
              <Empty text="Нет завершённых событий" />
            ) : (
              <ReliabilityBody data={reliability} onEventClick={navigateToEvent} />
            )}
          </Accordion>

          {canSeeFinances && (
            <Accordion
              label="Финансы · в этой команде"
              open={openSection === "finances"}
              onToggle={() => toggleSection("finances")}
              peek={financesPeek}
            >
              {finances === undefined ? (
                <SkeletonRow />
              ) : finances === null ? (
                <Empty text="Не удалось загрузить" />
              ) : (
                <FinancesBody data={finances} onEventClick={navigateToEvent} />
              )}
            </Accordion>
          )}

          <Accordion
            label="Игровая статистика"
            open={openSection === "stats"}
            onToggle={() => toggleSection("stats")}
          >
            <Empty text="🏗 Скоро — голы, передачи, MVP" />
          </Accordion>

          {actionError && (
            <p className="text-[12px] text-center" style={{ color: "#E53935" }}>
              {actionError}
            </p>
          )}

          {isOrganizer && !isSelf && (
            <div className="flex flex-col gap-2 pt-1">
              {!isTargetOrganizer && (
                <button
                  onClick={handlePromote}
                  disabled={busy}
                  className="w-full h-11 rounded-xl text-[14px] font-semibold disabled:opacity-50"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--text-primary)",
                  }}
                >
                  {busy ? "Обновляю…" : "Сделать организатором"}
                </button>
              )}
              <button
                onClick={handleRemove}
                disabled={busy}
                className="w-full h-11 rounded-xl text-[14px] font-semibold disabled:opacity-50"
                style={{ background: "#FFF1F1", color: "#E53935" }}
              >
                {busy ? "Удаляю…" : "Удалить из команды"}
              </button>
            </div>
          )}

          {isSelf &&
            (confirmLeave ? (
              <div className="rounded-xl p-3" style={{ background: "#FFF1F1" }}>
                <p
                  className="text-[13px] text-center mb-3"
                  style={{ color: "#E53935" }}
                >
                  Вы уверены? Вы покинете команду.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmLeave(false)}
                    className="flex-1 h-10 rounded-xl text-[14px] font-semibold"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-primary)",
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleLeave}
                    disabled={busy}
                    className="flex-1 h-10 rounded-xl text-[14px] font-semibold disabled:opacity-50"
                    style={{ background: "#E53935", color: "white" }}
                  >
                    {busy ? "Выхожу…" : "Выйти"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmLeave(true)}
                className="w-full h-11 rounded-xl text-[14px] font-semibold"
                style={{ background: "#FFF1F1", color: "#E53935" }}
              >
                Покинуть команду
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
