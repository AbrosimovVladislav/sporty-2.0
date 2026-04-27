"use client";

import { useState } from "react";

type Props = {
  isPublic: boolean;
  status: string;
  onTogglePublic: () => Promise<void>;
  onCancel: () => Promise<void>;
};

export function EventManagement({
  isPublic,
  status,
  onTogglePublic,
  onCancel,
}: Props) {
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
      <p
        className="text-[11px] font-semibold uppercase mb-2 px-1"
        style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
      >
        Управление событием
      </p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1.5px solid var(--gray-200)" }}
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "var(--green-50)", color: "var(--green-600)" }}
          >
            {isPublic ? <GlobeIcon /> : <LockIcon />}
          </span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[14px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Публичное событие
            </p>
            <p className="text-[12px] truncate" style={{ color: "var(--text-tertiary)" }}>
              {isPublic ? "Видно всем в поиске событий" : "Видно только участникам команды"}
            </p>
          </div>
          <Switch
            checked={isPublic}
            onChange={() => run("toggle", onTogglePublic)}
            disabled={busy !== null}
          />
        </div>

        {isPlanned && (
          <button
            type="button"
            onClick={() => run("cancel", onCancel)}
            disabled={busy !== null}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 disabled:opacity-50"
            style={{ borderTop: "1px solid var(--gray-100)" }}
          >
            <span
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.95 0.06 25)", color: "var(--danger)" }}
            >
              {busy === "cancel" ? <Spinner /> : <XIcon />}
            </span>
            <div className="flex-1 min-w-0 text-left">
              <p
                className="text-[14px] font-semibold"
                style={{ color: "var(--danger)" }}
              >
                Отменить событие
              </p>
              <p className="text-[12px] truncate" style={{ color: "var(--text-tertiary)" }}>
                Все ответы сохранятся, событие не вернуть
              </p>
            </div>
          </button>
        )}
      </div>
    </section>
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
      onClick={onChange}
      disabled={disabled}
      className="relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 shrink-0"
      style={{ background: checked ? "var(--green-500)" : "var(--gray-300)" }}
      aria-checked={checked}
      role="switch"
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
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
