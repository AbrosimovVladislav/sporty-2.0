"use client";

type Option = {
  value: string;
  label: string;
  /** Full label for accessibility / activeChip */
  fullLabel?: string;
};

type Props = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
};

export function FilterPills({ options, value, onChange }: Props) {
  const cols = options.length;
  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value || "all"}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-label={opt.fullLabel ?? opt.label}
            className="rounded-[10px] px-1 py-2 text-[12px] font-semibold transition-colors active:scale-[0.98] truncate"
            style={{
              background: active ? "var(--gray-900)" : "var(--bg-card)",
              color: active ? "white" : "var(--text-secondary)",
              border: active
                ? "1px solid var(--gray-900)"
                : "1px solid var(--gray-200)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
