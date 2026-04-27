"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  isPublic: boolean;
  status: string;
  onClose: () => void;
  onTogglePublic: () => Promise<void>;
  onComplete: () => Promise<void>;
  onCancel: () => Promise<void>;
};

export function EventOrganizerSheet({
  open,
  isPublic,
  status,
  onClose,
  onTogglePublic,
  onComplete,
  onCancel,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open]);

  if (!open) return null;

  const isPlanned = status === "planned";

  async function run(key: string, fn: () => Promise<void>) {
    setBusy(key);
    try {
      await fn();
      onClose();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-3xl"
        style={{ boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--gray-200)" }} />
        </div>
        <div className="px-5 pb-3">
          <h3 className="text-[18px] font-bold">Управление событием</h3>
        </div>

        <ul className="px-2 pb-6">
          <Item
            icon={isPublic ? <GlobeIcon /> : <LockIcon />}
            title={isPublic ? "Скрыть из общего поиска" : "Сделать публичным"}
            subtitle={
              isPublic
                ? "Сейчас видно всем — даже не членам команды"
                : "Появится в поиске событий для всех"
            }
            disabled={busy !== null}
            loading={busy === "toggle"}
            onClick={() => run("toggle", onTogglePublic)}
          />
          {isPlanned && (
            <>
              <Item
                icon={<CheckIcon />}
                title="Завершить событие"
                subtitle="Перейдёт в архив, можно отметить присутствие"
                disabled={busy !== null}
                loading={busy === "complete"}
                onClick={() => run("complete", onComplete)}
                accent="green"
              />
              <Item
                icon={<XIcon />}
                title="Отменить событие"
                subtitle="Все ответы сохранятся, событие не вернуть"
                disabled={busy !== null}
                loading={busy === "cancel"}
                onClick={() => run("cancel", onCancel)}
                accent="danger"
              />
            </>
          )}
        </ul>
      </div>
    </div>
  );
}

function Item({
  icon,
  title,
  subtitle,
  onClick,
  disabled,
  loading,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  accent?: "green" | "danger";
}) {
  const iconBg =
    accent === "green"
      ? "var(--green-50)"
      : accent === "danger"
        ? "oklch(0.95 0.06 25)"
        : "var(--gray-100)";
  const iconColor =
    accent === "green"
      ? "var(--green-600)"
      : accent === "danger"
        ? "var(--danger)"
        : "var(--text-secondary)";
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl active:bg-gray-50 disabled:opacity-50"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {loading ? <Spinner /> : icon}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[15px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {title}
          </p>
          <p className="text-[12px] truncate" style={{ color: "var(--text-tertiary)" }}>
            {subtitle}
          </p>
        </div>
      </button>
    </li>
  );
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function Spinner() {
  return (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
