"use client";

import { useCallback, useEffect, useState } from "react";

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

type Tab = "incoming" | "outgoing";

type Props = {
  open: boolean;
  teamId: string;
  userId: string | null;
  onClose: () => void;
  onActionDone: () => void;
};

export function TeamRequestsSheet({
  open,
  teamId,
  userId,
  onClose,
  onActionDone,
}: Props) {
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [outgoing, setOutgoing] = useState<OutgoingInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("incoming");

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/teams/${teamId}/join-requests?userId=${userId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setIncoming(data.incoming ?? []);
        setOutgoing(data.outgoing ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [teamId, userId]);

  useEffect(() => {
    if (open) fetchAll();
  }, [open, fetchAll]);

  // Default to whatever side has items
  useEffect(() => {
    if (!loading) {
      if (incoming.length === 0 && outgoing.length > 0) setTab("outgoing");
      else if (incoming.length > 0) setTab("incoming");
    }
  }, [loading, incoming.length, outgoing.length]);

  async function handleDecision(requestId: string, action: "accept" | "reject") {
    if (!userId || busy) return;
    setBusy(requestId);
    try {
      await fetch(`/api/teams/${teamId}/join-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      fetchAll();
      onActionDone();
    } finally {
      setBusy(null);
    }
  }

  async function handleWithdraw(requestId: string) {
    if (!userId || busy) return;
    setBusy(requestId);
    try {
      await fetch(`/api/join-requests/${requestId}?userId=${userId}`, {
        method: "DELETE",
      });
      fetchAll();
      onActionDone();
    } finally {
      setBusy(null);
    }
  }

  if (!open) return null;

  const showTabs = incoming.length > 0 && outgoing.length > 0;
  const list = tab === "incoming" ? incoming : outgoing;
  const totalCount = incoming.length + outgoing.length;

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
        className="relative w-full bg-white pb-8 max-h-[85vh] overflow-y-auto"
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
        <div className="flex items-center justify-between px-4 pt-1 pb-3">
          <h2
            className="text-[16px] font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Заявки · {totalCount}
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: "var(--gray-100)" }}
            aria-label="Закрыть"
          >
            <CloseIcon />
          </button>
        </div>

        {showTabs && (
          <div
            className="flex mx-4 mb-3 rounded-[12px] p-1 gap-1"
            style={{ background: "var(--gray-100)" }}
          >
            <TabBtn
              active={tab === "incoming"}
              onClick={() => setTab("incoming")}
              label={`Входящие · ${incoming.length}`}
            />
            <TabBtn
              active={tab === "outgoing"}
              onClick={() => setTab("outgoing")}
              label={`Отправлены · ${outgoing.length}`}
            />
          </div>
        )}

        <div className="px-4">
          {loading ? (
            <div className="py-8 flex justify-center">
              <div
                className="w-6 h-6 rounded-full border-2 animate-spin"
                style={{
                  borderColor: "var(--green-500)",
                  borderTopColor: "transparent",
                }}
              />
            </div>
          ) : totalCount === 0 ? (
            <p
              className="text-[13px] py-6 text-center"
              style={{ color: "var(--text-tertiary)" }}
            >
              Заявок и приглашений нет
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {list.map((r) =>
                tab === "incoming" ? (
                  <IncomingCard
                    key={r.id}
                    item={r as IncomingRequest}
                    busy={busy === r.id}
                    onAccept={() => handleDecision(r.id, "accept")}
                    onReject={() => handleDecision(r.id, "reject")}
                  />
                ) : (
                  <OutgoingCard
                    key={r.id}
                    item={r as OutgoingInvite}
                    busy={busy === r.id}
                    onWithdraw={() => handleWithdraw(r.id)}
                  />
                ),
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 py-2 rounded-[10px] text-[13px] font-semibold transition-colors"
      style={{
        background: active ? "white" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        boxShadow: active ? "var(--shadow-sm)" : "none",
      }}
    >
      {label}
    </button>
  );
}

function IncomingCard({
  item,
  busy,
  onAccept,
  onReject,
}: {
  item: IncomingRequest;
  busy: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <li
      className="rounded-xl p-3"
      style={{ background: "var(--gray-50)" }}
    >
      <div className="flex items-start gap-3">
        <Avatar name={item.user.name} src={item.user.avatar_url} />
        <div className="flex-1 min-w-0">
          <p
            className="text-[14px] font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {item.user.name}
          </p>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: "var(--text-tertiary)" }}
          >
            {[item.user.city, formatRelative(item.created_at)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={onAccept}
          disabled={busy}
          className="flex-1 h-9 rounded-lg text-[13px] font-semibold disabled:opacity-50"
          style={{ background: "var(--green-500)", color: "white" }}
        >
          {busy ? "…" : "Принять"}
        </button>
        <button
          onClick={onReject}
          disabled={busy}
          className="flex-1 h-9 rounded-lg text-[13px] font-semibold disabled:opacity-50"
          style={{
            background: "white",
            color: "var(--text-primary)",
            border: "1px solid var(--gray-200)",
          }}
        >
          {busy ? "…" : "Отклонить"}
        </button>
      </div>
    </li>
  );
}

function OutgoingCard({
  item,
  busy,
  onWithdraw,
}: {
  item: OutgoingInvite;
  busy: boolean;
  onWithdraw: () => void;
}) {
  return (
    <li
      className="rounded-xl p-3 flex items-center gap-3"
      style={{ background: "var(--gray-50)" }}
    >
      <Avatar name={item.user.name} src={item.user.avatar_url} />
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {item.user.name}
        </p>
        <p
          className="text-[11px] mt-0.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          Приглашён {formatRelative(item.created_at)}
          {item.user.city ? ` · ${item.user.city}` : ""}
        </p>
      </div>
      <button
        onClick={onWithdraw}
        disabled={busy}
        className="px-3 h-8 rounded-lg text-[12px] font-semibold disabled:opacity-50 shrink-0"
        style={{
          background: "white",
          color: "var(--text-primary)",
          border: "1px solid var(--gray-200)",
        }}
      >
        {busy ? "…" : "Отозвать"}
      </button>
    </li>
  );
}

function Avatar({
  name,
  src,
}: {
  name: string;
  src?: string | null;
}) {
  const initials = (() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  if (src) {
    return (
      <div
        className="w-11 h-11 rounded-full overflow-hidden shrink-0"
        style={{ background: "var(--gray-100)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-semibold text-[15px]"
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
  if (diffDays < 7) return `${diffDays} дн. назад`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
