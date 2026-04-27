"use client";

import { ReactNode } from "react";

export type ChipOption = {
  value: string;
  label: string;
};

type Props = {
  label: ReactNode;
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  /** Empty-state chip label, e.g. "Любой". Pass null to hide it. */
  emptyLabel?: string | null;
  /** Hint shown when there are no options (e.g. nothing matches) */
  emptyHint?: string;
};

/**
 * Single-select chip group for use inside bottom-sheet filters.
 * Replaces native <select> with tappable chips.
 */
export function SheetChipGroup({
  label,
  options,
  value,
  onChange,
  emptyLabel = "Любой",
  emptyHint,
}: Props) {
  const items: ChipOption[] = emptyLabel
    ? [{ value: "", label: emptyLabel }, ...options]
    : options;

  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-[12px] font-semibold uppercase"
        style={{
          letterSpacing: "0.06em",
          color: "var(--text-tertiary)",
        }}
      >
        {label}
      </span>
      {options.length === 0 && emptyHint ? (
        <p className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          {emptyHint}
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value || "__any__"}
                type="button"
                onClick={() => onChange(opt.value)}
                className="px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors"
                style={{
                  background: active ? "var(--gray-900)" : "var(--bg-card)",
                  color: active ? "white" : "var(--text-secondary)",
                  border: active
                    ? "1.5px solid var(--gray-900)"
                    : "1.5px solid var(--gray-200)",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
