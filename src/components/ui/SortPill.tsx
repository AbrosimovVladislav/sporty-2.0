/**
 * SortPill — Design System v2.
 * Pill-style dropdown trigger: sort icon + label + chevron, h-32, --green-50 bg.
 */

"use client";

import { useEffect, useRef, useState } from "react";

type SortOption = { value: string; label: string };

type Props = {
  value: string;
  options: SortOption[];
  onChange: (v: string) => void;
};

export function SortPill({ value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-semibold"
        style={{
          background: "var(--green-50)",
          color: "var(--green-800)",
        }}
      >
        <SortIcon />
        {current?.label}
        <ChevronIcon />
      </button>
      {open && (
        <ul
          className="absolute right-0 top-full mt-1.5 z-20 min-w-[180px] py-1 rounded-[12px] overflow-hidden"
          style={{
            background: "var(--card)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--ink-100)",
          }}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-[14px]"
                  style={{
                    color: active ? "var(--green-800)" : "var(--ink-900)",
                    fontWeight: active ? 600 : 400,
                    background: active ? "var(--green-50)" : "transparent",
                  }}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SortIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7h13" />
      <path d="M3 12h9" />
      <path d="M3 17h5" />
      <path d="m17 8 4 4-4 4" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
