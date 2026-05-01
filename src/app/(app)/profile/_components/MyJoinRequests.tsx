"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Pill } from "@/components/ui";
import { SPORT_LABEL } from "@/lib/catalogs";
import type { JoinRequestItem } from "./types";
import { Eyebrow } from "./atoms";

const HISTORY_DAYS = 30;

const STATUS_LABEL: Record<string, string> = {
  pending: "На рассмотрении",
  accepted: "Принята",
  rejected: "Отклонена",
};
const STATUS_PILL: Record<string, "role" | "statusMuted" | "statusDanger"> = {
  pending: "role",
  accepted: "statusMuted",
  rejected: "statusDanger",
};

export function MyJoinRequests({ userId }: { userId: string }) {
  const [requests, setRequests] = useState<JoinRequestItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  function load() {
    fetch(`/api/users/${userId}/join-requests`)
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .catch(() => setRequests([]));
  }

  useEffect(() => {
    load();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function respond(requestId: string, decision: "accept" | "reject") {
    if (busy) return;
    setBusy(requestId);
    try {
      await fetch(`/api/join-requests/${requestId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, decision }),
      });
      load();
    } finally {
      setBusy(null);
    }
  }

  async function withdraw(requestId: string) {
    if (busy) return;
    setBusy(requestId);
    try {
      await fetch(`/api/join-requests/${requestId}?userId=${userId}`, {
        method: "DELETE",
      });
      load();
    } finally {
      setBusy(null);
    }
  }

  if (requests === null) return null;

  const invitations = requests.filter(
    (r) => r.direction === "team_to_player" && r.status === "pending",
  );
  const myApplications = requests.filter(
    (r) => r.direction === "player_to_team" && r.status === "pending",
  );

  const historyCutoff = Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000;
  const history = requests.filter((r) => {
    if (r.status === "pending") return false;
    const t = r.resolved_at
      ? new Date(r.resolved_at).getTime()
      : new Date(r.created_at).getTime();
    return t >= historyCutoff;
  });

  if (
    invitations.length === 0 &&
    myApplications.length === 0 &&
    history.length === 0
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {invitations.length > 0 && (
        <RequestsList eyebrow={`Меня пригласили · ${invitations.length}`}>
          {invitations.map((r) => (
            <RequestItemBase key={r.id} item={r}>
              <p
                className="text-[13px] mt-0.5"
                style={{ color: "var(--text-tertiary)" }}
              >
                Пригласил
                {r.inviter_name ? ` ${r.inviter_name}` : ""} ·{" "}
                {formatRelative(r.created_at)}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="primary"
                  size="md"
                  disabled={busy === r.id}
                  loading={busy === r.id}
                  onClick={() => respond(r.id, "accept")}
                  className="flex-1"
                >
                  Принять
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  disabled={busy === r.id}
                  onClick={() => respond(r.id, "reject")}
                  className="flex-1"
                >
                  Отклонить
                </Button>
              </div>
            </RequestItemBase>
          ))}
        </RequestsList>
      )}

      {myApplications.length > 0 && (
        <RequestsList eyebrow={`Мои заявки в команды · ${myApplications.length}`}>
          {myApplications.map((r) => (
            <RequestItemBase key={r.id} item={r}>
              <div className="flex items-center justify-between mt-1">
                <span
                  className="text-[12px] font-semibold rounded-full px-2 py-0.5"
                  style={{
                    background: "var(--green-50)",
                    color: "var(--green-700)",
                  }}
                >
                  На рассмотрении
                </span>
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => withdraw(r.id)}
                  className="text-[13px] font-semibold disabled:opacity-50"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {busy === r.id ? "…" : "Отозвать"}
                </button>
              </div>
              <p
                className="text-[12px] mt-1"
                style={{ color: "var(--text-tertiary)" }}
              >
                Подана {formatRelative(r.created_at)}
              </p>
            </RequestItemBase>
          ))}
        </RequestsList>
      )}

      {history.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[12px] font-semibold uppercase"
            style={{
              letterSpacing: "0.06em",
              color: "var(--text-tertiary)",
            }}
          >
            {historyOpen
              ? "Скрыть историю"
              : `Показать историю · ${history.length}`}
            <ChevronIcon open={historyOpen} />
          </button>
          {historyOpen && (
            <ul
              className="mt-2 rounded-[16px] overflow-hidden"
              style={{ background: "var(--bg-primary)" }}
            >
              {history.map((r, i) => (
                <li
                  key={r.id}
                  className="px-4 py-3"
                  style={{
                    borderTop: i === 0 ? undefined : "1px solid var(--gray-100)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/team/${r.team.id}`} className="flex-1 min-w-0">
                      <p
                        className="text-[15px] font-semibold truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {r.team.name}
                      </p>
                      <p
                        className="text-[12px] mt-0.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {r.direction === "team_to_player"
                          ? "Приглашение"
                          : "Моя заявка"}{" "}
                        ·{" "}
                        {r.resolved_at
                          ? formatRelative(r.resolved_at)
                          : formatRelative(r.created_at)}
                      </p>
                    </Link>
                    <Pill variant={STATUS_PILL[r.status] ?? "statusMuted"}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Pill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function RequestsList({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Eyebrow>{eyebrow}</Eyebrow>
      <ul
        className="mt-2 rounded-[16px] overflow-hidden flex flex-col"
        style={{ background: "var(--bg-primary)" }}
      >
        {Array.isArray(children) ? (
          children.map((c, i) => (
            <li
              key={i}
              className="px-4 py-3"
              style={{
                borderTop: i === 0 ? undefined : "1px solid var(--gray-100)",
              }}
            >
              {c}
            </li>
          ))
        ) : (
          <li className="px-4 py-3">{children}</li>
        )}
      </ul>
    </div>
  );
}

function RequestItemBase({
  item,
  children,
}: {
  item: JoinRequestItem;
  children: React.ReactNode;
}) {
  return (
    <>
      <Link href={`/team/${item.team.id}`} className="block min-w-0">
        <p
          className="text-[15px] font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {item.team.name}
        </p>
        <p
          className="text-[13px] mt-0.5"
          style={{ color: "var(--text-secondary)" }}
        >
          {item.team.city} · {SPORT_LABEL[item.team.sport] ?? item.team.sport}
        </p>
      </Link>
      {children}
    </>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "сегодня";
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: open ? "rotate(180deg)" : "none",
        transition: "transform 150ms",
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
