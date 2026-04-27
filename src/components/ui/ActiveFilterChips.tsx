"use client";

export type FilterChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

type Props = {
  chips: FilterChip[];
  className?: string;
};

export function ActiveFilterChips({ chips, className = "" }: Props) {
  if (chips.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {chips.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={c.onRemove}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-transform active:scale-95"
          style={{
            background: "var(--green-50)",
            color: "var(--green-700)",
          }}
        >
          <span>{c.label}</span>
          <span
            className="w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.08)" }}
          >
            <CloseIcon />
          </span>
        </button>
      ))}
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}
