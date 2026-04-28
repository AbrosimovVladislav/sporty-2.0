"use client";

import { useCallback, useEffect, useState } from "react";

type JoinRequest = {
  id: string;
  user_id: string;
  created_at: string;
  user: { id: string; name: string; city: string | null };
};

type Props = {
  open: boolean;
  teamId: string;
  userId: string | null;
  onClose: () => void;
  onActionDone: () => void;
};

export function TeamRequestsSheet({ open, teamId, userId, onClose, onActionDone }: Props) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/join-requests?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [teamId, userId]);

  useEffect(() => {
    if (open) fetchRequests();
  }, [open, fetchRequests]);

  async function handleDecision(requestId: string, action: "accept" | "reject") {
    if (!userId || busy) return;
    setBusy(requestId);
    try {
      await fetch(`/api/teams/${teamId}/join-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      fetchRequests();
      onActionDone();
    } finally {
      setBusy(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full bg-white pb-8"
        style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, boxShadow: "0 -8px 24px rgba(0,0,0,0.12)" }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span className="block w-9 h-1 rounded-full" style={{ background: "var(--gray-300)" }} />
        </div>
        <div className="flex items-center justify-between px-4 pt-1 pb-3">
          <h2 className="text-[16px] font-bold" style={{ color: "var(--text-primary)" }}>
            Заявки · {requests.length}
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

        <div className="px-4">
          {loading ? (
            <div className="py-8 flex justify-center">
              <div
                className="w-6 h-6 rounded-full border-2 animate-spin"
                style={{ borderColor: "var(--green-500)", borderTopColor: "transparent" }}
              />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-[13px] py-6 text-center" style={{ color: "var(--text-tertiary)" }}>
              Новых заявок нет
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {requests.map((r) => (
                <li key={r.id} className="rounded-xl p-3" style={{ background: "var(--gray-50)" }}>
                  <div className="flex items-start gap-3">
                    <Avatar name={r.user.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {r.user.name}
                      </p>
                      {r.user.city && (
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                          {r.user.city}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleDecision(r.id, "accept")}
                      disabled={busy === r.id}
                      className="flex-1 h-9 rounded-lg text-[13px] font-semibold disabled:opacity-50"
                      style={{ background: "var(--green-500)", color: "white" }}
                    >
                      {busy === r.id ? "…" : "Принять"}
                    </button>
                    <button
                      onClick={() => handleDecision(r.id, "reject")}
                      disabled={busy === r.id}
                      className="flex-1 h-9 rounded-lg text-[13px] font-semibold disabled:opacity-50"
                      style={{ background: "white", color: "var(--text-primary)", border: "1px solid var(--gray-200)" }}
                    >
                      {busy === r.id ? "…" : "Отклонить"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = (() => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 font-semibold text-[15px]"
      style={{ background: "var(--green-50)", color: "var(--green-700)" }}
    >
      {initials}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
