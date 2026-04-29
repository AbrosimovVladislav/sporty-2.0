"use client";

import { useEffect, useRef, useState } from "react";

type SortOption = { value: string; label: string };

type Props = {
  countLabel?: string | null;
  sort?: {
    value: string;
    options: SortOption[];
    onChange: (value: string) => void;
  };
};

export function ListMeta({ countLabel, sort }: Props) {
  if (!countLabel && !sort) return null;
  return (
    <div
      className={`flex items-center mb-3 min-h-[20px] ${countLabel ? "justify-between" : "justify-end"}`}
    >
      {countLabel && (
        <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          {countLabel}
        </span>
      )}
      {sort && (
        <SortDropdown value={sort.value} options={sort.options} onChange={sort.onChange} />
      )}
    </div>
  );
}

function SortDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SortOption[];
  onChange: (v: string) => void;
}) {
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
        className="flex items-center gap-1 text-[13px] font-semibold rounded-full pl-3 pr-2 py-1 transition-colors"
        style={{
          color: "var(--green-700)",
          background: "var(--bg-card)",
          border: "1px solid var(--gray-200)",
        }}
      >
        {current?.label}
        <ChevronDownIcon />
      </button>
      {open && (
        <ul
          className="absolute right-0 top-full mt-1.5 z-20 min-w-[160px] py-1 rounded-[12px] overflow-hidden"
          style={{ background: "white", boxShadow: "var(--shadow-lg)" }}
        >
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="w-full text-left px-3.5 py-2.5 text-[14px]"
                style={{
                  color: o.value === value ? "var(--green-600)" : "var(--text-primary)",
                  fontWeight: o.value === value ? 600 : 400,
                  background: o.value === value ? "var(--green-50)" : "transparent",
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
