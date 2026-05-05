"use client";

import { SortPill } from "./SortPill";

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
      className={`flex items-center mb-3 min-h-[32px] ${countLabel ? "justify-between" : "justify-end"}`}
    >
      {countLabel && (
        <span className="text-[13px]" style={{ color: "var(--ink-500)" }}>
          {countLabel}
        </span>
      )}
      {sort && (
        <SortPill value={sort.value} options={sort.options} onChange={sort.onChange} />
      )}
    </div>
  );
}
