"use client";

import { useState } from "react";

type Props = {
  isPublic: boolean;
  status: string;
  onTogglePublic: () => Promise<void>;
  onComplete: () => Promise<void>;
  onCancel: () => Promise<void>;
};

export function EventManagement({
  isPublic,
  status,
  onTogglePublic,
  onComplete,
  onCancel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const isPlanned = status === "planned";

  async function run(key: string, fn: () => Promise<void>) {
    if (busy) return;
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="px-4 mt-6">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1.5px solid var(--gray-200)" }}
      >
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-3.5 transition-colors active:bg-gray-50"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--gray-100)", color: "var(--text-secondary)" }}
            >
              <SettingsIcon />
            </span>
            <span
              className="text-[15px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Управление событием
            </span>
          </div>
          <span
            className="transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <ChevronDownIcon />
          </span>
        </button>

        {open && (
          <div style={{ borderTop: "1px solid var(--gray-200)" }}>
            <Row
              icon={isPublic ? <GlobeIcon /> : <LockIcon />}
              title={isPublic ? "Публичное событие" : "Только для команды"}
              subtitle={
                isPublic
                  ? "Видно всем в поиске событий"
                  : "Видно только участникам команды"
              }
              iconBg="var(--green-50)"
              iconColor="var(--green-600)"
              right={
                <Switch
                  checked={isPublic}
                  onChange={() => run("toggle", onTogglePublic)}
                  disabled={busy !== null}
                />
              }
            />

            {isPlanned && (
              <>
                <Row
                  icon={<CheckIcon />}
                  title="Завершить событие"
                  subtitle="Перейдёт в архив, можно отметить присутствие"
                  iconBg="var(--green-50)"
                  iconColor="var(--green-600)"
                  loading={busy === "complete"}
                  disabled={busy !== null}
                  onClick={() => run("complete", onComplete)}
                />
                <Row
                  icon={<XIcon />}
                  title="Отменить событие"
                  subtitle="Все ответы сохранятся, событие не вернуть"
                  iconBg="oklch(0.95 0.06 25)"
                  iconColor="var(--danger)"
                  loading={busy === "cancel"}
                  disabled={busy !== null}
                  onClick={() => run("cancel", onCancel)}
                />
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Row({
  icon,
  title,
  subtitle,
  iconBg,
  iconColor,
  right,
  onClick,
  disabled,
  loading,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
  right?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={onClick ? disabled : undefined}
      className={`w-full flex items-center gap-3 px-4 py-3 ${onClick ? "active:bg-gray-50 disabled:opacity-50" : ""}`}
      style={{ borderTop: "1px solid var(--gray-100)" }}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: iconBg, color: iconColor }}
      >
        {loading ? <Spinner /> : icon}
      </span>
      <div className="flex-1 min-w-0 text-left">
        <p
          className="text-[14px] font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </p>
        <p
          className="text-[12px] truncate"
          style={{ color: "var(--text-tertiary)" }}
        >
          {subtitle}
        </p>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </Tag>
  );
}

function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
      disabled={disabled}
      className="relative w-11 h-6 rounded-full transition-colors disabled:opacity-50"
      style={{ background: checked ? "var(--green-500)" : "var(--gray-300)" }}
      aria-checked={checked}
      role="switch"
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow"
        style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
      />
    </button>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function ChevronDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function Spinner() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
