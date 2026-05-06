"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { pluralize } from "@/lib/format";
import { Eyebrow } from "./atoms";

type IncomingRequest = {
  id: string;
  user_id: string;
  created_at: string;
  user: { id: string; name: string; city: string | null; avatar_url: string | null };
};

type OutgoingInvite = {
  id: string;
  user_id: string;
  created_at: string;
  invited_by: string | null;
  user: { id: string; name: string; city: string | null; avatar_url: string | null };
};

type Props = {
  teamId: string;
  userId: string | null;
  onResolved: () => void;
};

export function TeamRequestsSection({
  teamId,
  userId,
  onResolved,
}: Props) {
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingInvite[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!userId) {
      setLoaded(true);
      return;
    }
    const res = await fetch(`/api/teams/${teamId}/join-requests?userId=${userId}`);
    if (!res.ok) {
      setLoaded(true);
      return;
    }
    const data = await res.json();
    setIncoming(data.incoming ?? []);
    setOutgoing(data.outgoing ?? []);
    setLoaded(true);
  }, [teamId, userId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function decide(requestId: string, action: "accept" | "reject") {
    if (!userId || busy) return;
    setBusy(requestId);
    try {
      await fetch(`/api/teams/${teamId}/join-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      await fetchAll();
      onResolved();
    } finally {
      setBusy(null);
    }
  }

  async function withdraw(requestId: string) {
    if (!userId || busy) return;
    setBusy(requestId);
    try {
      await fetch(`/api/join-requests/${requestId}?userId=${userId}`, {
        method: "DELETE",
      });
      await fetchAll();
      onResolved();
    } finally {
      setBusy(null);
    }
  }

  const total = incoming.length + outgoing.length;
  const hasAny = total > 0;
  const isEmpty = loaded && !hasAny;

  const incomingLabel = `${incoming.length} ${pluralize(incoming.length, [
    "новая",
    "новых",
    "новых",
  ])}`;
  const outgoingLabel = `${outgoing.length} ${pluralize(outgoing.length, [
    "приглашение",
    "приглашения",
    "приглашений",
  ])}`;

  const summary = hasAny
    ? [
        incoming.length > 0 ? incomingLabel : null,
        outgoing.length > 0 ? outgoingLabel : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : "Никто не подал заявку, никого не пригласили";

  const headlineText = !loaded
    ? "Загрузка…"
    : hasAny
      ? `${total} ${pluralize(total, ["заявка", "заявки", "заявок"])}`
      : "Заявок нет";

  return (
    <div
      className="rounded-[16px]"
      style={{
        background: "var(--card)",
        border: "1px solid var(--ink-100)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:opacity-90"
      >
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: hasAny ? "var(--green-700)" : "var(--ink-100)",
            color: hasAny ? "white" : "var(--ink-500)",
          }}
        >
          <BellIcon />
        </span>
        <div className="flex-1 min-w-0">
          <Eyebrow>Заявки в команду</Eyebrow>
          <p
            className="text-[15px] font-semibold mt-0.5"
            style={{ color: "var(--ink-900)" }}
          >
            {headlineText}
          </p>
          {loaded && (
            <p
              className="text-[12px] mt-0.5"
              style={{ color: "var(--ink-500)" }}
            >
              {summary}
            </p>
          )}
        </div>
        <span
          className="transition-transform shrink-0"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            color: "var(--ink-500)",
          }}
        >
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div style={{ borderTop: "1px solid var(--ink-100)" }}>
          {isEmpty && (
            <div className="px-4 py-6 text-center">
              <p
                className="text-[14px]"
                style={{ color: "var(--ink-500)" }}
              >
                Никаких входящих заявок и отправленных приглашений нет.
              </p>
              <p
                className="text-[12px] mt-1.5"
                style={{ color: "var(--ink-400)" }}
              >
                Игроки могут попроситься со страницы команды,
                либо ты сам можешь пригласить кого-то с публичного профиля.
              </p>
            </div>
          )}
          {incoming.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <Eyebrow>Входящие · {incoming.length}</Eyebrow>
            </div>
          )}
          {incoming.map((item) => (
            <div
              key={item.id}
              className="px-4 py-3"
              style={{ borderTop: "1px solid var(--ink-100)" }}
            >
              <div className="flex items-start gap-3">
                <Avatar name={item.user.name} src={item.user.avatar_url} />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[14px] font-semibold truncate"
                    style={{ color: "var(--ink-900)" }}
                  >
                    {item.user.name}
                  </p>
                  <p
                    className="text-[12px] mt-0.5"
                    style={{ color: "var(--ink-500)" }}
                  >
                    {[item.user.city, formatRelative(item.created_at)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => decide(item.id, "accept")}
                  disabled={busy === item.id}
                  className="flex-1 h-9 rounded-[10px] text-[13px] font-semibold disabled:opacity-50 transition-colors active:opacity-80"
                  style={{ background: "var(--green-700)", color: "white" }}
                >
                  {busy === item.id ? "…" : "Принять"}
                </button>
                <button
                  onClick={() => decide(item.id, "reject")}
                  disabled={busy === item.id}
                  className="flex-1 h-9 rounded-[10px] text-[13px] font-semibold disabled:opacity-50 transition-colors active:opacity-80"
                  style={{
                    background: "var(--bg-secondary)",
                    color: "var(--ink-900)",
                    border: "1px solid var(--ink-200)",
                  }}
                >
                  {busy === item.id ? "…" : "Отклонить"}
                </button>
              </div>
            </div>
          ))}

          {outgoing.length > 0 && (
            <div className="px-4 pt-3 pb-1" style={{ borderTop: incoming.length > 0 ? "1px solid var(--ink-100)" : undefined }}>
              <Eyebrow>Отправлены · {outgoing.length}</Eyebrow>
            </div>
          )}
          {outgoing.map((item) => (
            <div
              key={item.id}
              className="px-4 py-3 flex items-center gap-3"
              style={{ borderTop: "1px solid var(--ink-100)" }}
            >
              <Avatar name={item.user.name} src={item.user.avatar_url} />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[14px] font-semibold truncate"
                  style={{ color: "var(--ink-900)" }}
                >
                  {item.user.name}
                </p>
                <p
                  className="text-[12px] mt-0.5"
                  style={{ color: "var(--ink-500)" }}
                >
                  Приглашён {formatRelative(item.created_at)}
                  {item.user.city ? ` · ${item.user.city}` : ""}
                </p>
              </div>
              <button
                onClick={() => withdraw(item.id)}
                disabled={busy === item.id}
                className="px-3 h-8 rounded-[10px] text-[12px] font-semibold disabled:opacity-50 shrink-0"
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--ink-700)",
                  border: "1px solid var(--ink-200)",
                }}
              >
                {busy === item.id ? "…" : "Отозвать"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Avatar({ name, src }: { name: string; src: string | null }) {
  const initials = (() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  if (src) {
    return (
      <div
        className="w-11 h-11 rounded-full overflow-hidden shrink-0"
        style={{ background: "var(--ink-100)" }}
      >
        <Image
          src={src}
          alt={name}
          width={44}
          height={44}
          sizes="44px"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-semibold text-[14px]"
      style={{ background: "var(--green-50)", color: "var(--green-700)" }}
    >
      {initials}
    </div>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "сегодня";
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
