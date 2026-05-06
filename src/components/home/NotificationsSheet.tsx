"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { NotificationType } from "@/lib/notifications";

type NotificationItem = {
  id: string;
  type: NotificationType | string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

type Props = {
  open: boolean;
  userId: string | null;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
};

const ICON_BG: Record<string, string> = {
  team_invitation_received: "var(--green-50)",
  team_join_request_received: "var(--green-50)",
  team_join_request_accepted: "var(--green-50)",
  team_join_request_rejected: "var(--danger-soft)",
  team_invitation_accepted: "var(--green-50)",
  team_invitation_rejected: "var(--danger-soft)",
  team_member_promoted: "var(--green-50)",
  team_member_removed: "var(--danger-soft)",
  event_created: "#e0effd",
  event_cancelled: "var(--danger-soft)",
  finance_payment_recorded: "#fff4dd",
};

const ICON_FG: Record<string, string> = {
  team_invitation_received: "var(--green-700)",
  team_join_request_received: "var(--green-700)",
  team_join_request_accepted: "var(--green-700)",
  team_join_request_rejected: "var(--danger)",
  team_invitation_accepted: "var(--green-700)",
  team_invitation_rejected: "var(--danger)",
  team_member_promoted: "var(--green-700)",
  team_member_removed: "var(--danger)",
  event_created: "#2a6ec2",
  event_cancelled: "var(--danger)",
  finance_payment_recorded: "#c48a14",
};

export function NotificationsSheet({ open, userId, onClose, onUnreadChange }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/users/${userId}/notifications?limit=50`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setItems(d.notifications ?? []);
        onUnreadChange?.(d.unreadCount ?? 0);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markAllRead() {
    if (!userId) return;
    await fetch(`/api/users/${userId}/notifications/mark-read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setItems((prev) =>
      prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
    );
    onUnreadChange?.(0);
  }

  async function handleTap(item: NotificationItem) {
    if (!userId) return;
    if (!item.read_at) {
      fetch(`/api/users/${userId}/notifications/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [item.id] }),
      }).catch(() => {});
      setItems((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n,
        ),
      );
      onUnreadChange?.(Math.max(0, items.filter((n) => !n.read_at).length - 1));
    }
    const href = (item.payload as { href?: string }).href;
    onClose();
    if (href) router.push(href);
  }

  if (!open) return null;

  const unread = items.filter((n) => !n.read_at).length;

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
        className="relative w-full pb-6 max-h-[88vh] overflow-y-auto"
        style={{
          background: "var(--card)",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <span
            className="block w-9 h-1 rounded-full"
            style={{ background: "var(--ink-300)" }}
          />
        </div>
        <div className="flex items-center justify-between px-4 pt-1 pb-3">
          <h2
            className="text-[17px] font-bold"
            style={{ color: "var(--ink-900)" }}
          >
            Уведомления
            {unread > 0 && (
              <span
                className="ml-2 text-[12px] font-bold inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full px-1.5"
                style={{ background: "var(--green-700)", color: "white" }}
              >
                {unread}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-3">
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[13px] font-semibold"
                style={{ color: "var(--green-700)" }}
              >
                Прочитать все
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "var(--ink-100)", color: "var(--ink-700)" }}
              aria-label="Закрыть"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-10 flex justify-center">
            <div
              className="w-6 h-6 rounded-full border-2 animate-spin"
              style={{
                borderColor: "var(--green-700)",
                borderTopColor: "transparent",
              }}
            />
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p
              className="text-[14px]"
              style={{ color: "var(--ink-500)" }}
            >
              Здесь будут уведомления о приглашениях, заявках и событиях.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col">
            {items.map((n, i) => (
              <li
                key={n.id}
                style={{
                  borderTop: i === 0 ? undefined : "1px solid var(--ink-100)",
                }}
              >
                <button
                  type="button"
                  onClick={() => handleTap(n)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left active:opacity-70 transition-opacity"
                >
                  <NotificationIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[14px] leading-tight"
                      style={{
                        color: "var(--ink-900)",
                        fontWeight: n.read_at ? 500 : 700,
                      }}
                    >
                      {renderTitle(n)}
                    </p>
                    {renderSubtitle(n) && (
                      <p
                        className="text-[12px] mt-0.5"
                        style={{ color: "var(--ink-500)" }}
                      >
                        {renderSubtitle(n)}
                      </p>
                    )}
                    <p
                      className="text-[11px] mt-1"
                      style={{ color: "var(--ink-400)" }}
                    >
                      {formatRelative(n.created_at)}
                    </p>
                  </div>
                  {!n.read_at && (
                    <span
                      className="mt-2 w-2 h-2 rounded-full shrink-0"
                      style={{ background: "var(--green-700)" }}
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  const bg = ICON_BG[type] ?? "var(--ink-100)";
  const fg = ICON_FG[type] ?? "var(--ink-500)";
  return (
    <span
      className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
      style={{ background: bg, color: fg }}
    >
      <Glyph type={type} />
    </span>
  );
}

function Glyph({ type }: { type: string }) {
  if (type.startsWith("event_")) {
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
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    );
  }
  if (type === "finance_payment_recorded") {
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
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    );
  }
  if (type === "team_member_promoted") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7z" />
      </svg>
    );
  }
  if (type === "team_member_removed") {
    return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }
  // default — user-plus / shield
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function renderTitle(n: NotificationItem): string {
  const p = n.payload as {
    actor_name?: string;
    team_name?: string;
    amount?: number;
    tx_kind?: string;
  };
  const team = p.team_name ?? "команда";
  switch (n.type) {
    case "team_invitation_received":
      return `${p.actor_name ?? "Организатор"} приглашает в «${team}»`;
    case "team_join_request_received":
      return `${p.actor_name ?? "Игрок"} хочет вступить в «${team}»`;
    case "team_join_request_accepted":
      return `Тебя приняли в «${team}»`;
    case "team_join_request_rejected":
      return `Заявку в «${team}» отклонили`;
    case "team_invitation_accepted":
      return `${p.actor_name ?? "Игрок"} принял приглашение в «${team}»`;
    case "team_invitation_rejected":
      return `${p.actor_name ?? "Игрок"} отклонил приглашение в «${team}»`;
    case "team_member_promoted":
      return `Тебя сделали организатором «${team}»`;
    case "team_member_removed":
      return `Тебя удалили из «${team}»`;
    case "event_created":
      return `Новое событие в «${team}»`;
    case "event_cancelled":
      return `Событие в «${team}» отменено`;
    case "finance_payment_recorded":
      return p.tx_kind === "deposit"
        ? `Депозит ${formatAmount(p.amount)} ₸ в «${team}»`
        : `Оплата ${formatAmount(p.amount)} ₸ за событие · «${team}»`;
    default:
      return "Новое уведомление";
  }
}

function renderSubtitle(n: NotificationItem): string | null {
  const p = n.payload as { event_date?: string };
  if (n.type === "event_created" || n.type === "event_cancelled") {
    if (p.event_date) {
      const d = new Date(p.event_date);
      return d.toLocaleString("ru-RU", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  return null;
}

function formatAmount(n: number | undefined): string {
  if (typeof n !== "number") return "—";
  return n.toLocaleString("ru-RU");
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "только что";
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} ч назад`;
  const diffDays = Math.floor(diffH / 24);
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays} дн назад`;
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
