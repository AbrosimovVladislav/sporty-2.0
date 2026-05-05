"use client";

type CityPicker = {
  value: string;
  onClick: () => void;
};

type Props = {
  value: string;
  onChange: (v: string) => void;
  onFilterClick?: () => void;
  filterActiveCount?: number;
  placeholder?: string;
  cityPicker?: CityPicker;
};

export function ListSearchBar({
  value,
  onChange,
  onFilterClick,
  filterActiveCount = 0,
  placeholder = "Поиск",
  cityPicker,
}: Props) {
  return (
    <div className="flex gap-2 mb-3">
      <div className="flex-1 relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--ink-400)" }}
        >
          <SearchIcon />
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Очистить"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "var(--ink-300)", color: "white" }}
          >
            <CloseIcon />
          </button>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-[42px] pl-10 pr-9 rounded-[12px] text-[14px] outline-none transition-colors focus:border-green-700"
          style={{
            background: "var(--bg)",
            color: "var(--ink-900)",
            border: "1px solid var(--ink-100)",
          }}
        />
      </div>
      {cityPicker && (
        <button
          type="button"
          onClick={cityPicker.onClick}
          className="h-[42px] px-3 rounded-[12px] flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
          style={{
            background: "var(--card)",
            color: "var(--ink-900)",
            border: "1px solid var(--ink-200)",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <PinIcon />
          <span className="truncate max-w-[80px]">{cityPicker.value}</span>
          <ChevronDownIcon />
        </button>
      )}
      {onFilterClick && (
        <button
          type="button"
          onClick={onFilterClick}
          aria-label="Фильтры"
          className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center relative active:scale-95 transition-transform shrink-0"
          style={{
            background: "var(--card)",
            color: "var(--ink-900)",
            border: "1px solid var(--ink-200)",
          }}
        >
          <FunnelIcon />
          {filterActiveCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 tabular-nums"
              style={{ background: "var(--green-700)", color: "white" }}
            >
              {filterActiveCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function SearchIcon() {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function FunnelIcon() {
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
      <path d="M3 4h18l-7 8.5V19l-4 2v-8.5L3 4Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: "var(--ink-700)" }}
    >
      <path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function ChevronDownIcon() {
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
      style={{ color: "var(--ink-500)" }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="10"
      height="10"
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
