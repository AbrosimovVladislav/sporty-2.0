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
          className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--text-tertiary)" }}
        >
          <SearchIcon />
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Очистить"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "var(--gray-300)", color: "white" }}
          >
            <CloseIcon />
          </button>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-9 py-3 rounded-[14px] text-[14px] outline-none transition-colors focus:border-green-500"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1.5px solid var(--gray-200)",
          }}
        />
      </div>
      {cityPicker && (
        <button
          type="button"
          onClick={cityPicker.onClick}
          className="h-[46px] px-3.5 rounded-[14px] flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1.5px solid var(--gray-200)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span className="truncate max-w-[80px]">{cityPicker.value}</span>
          <ChevronDownIcon />
        </button>
      )}
      {onFilterClick && (
        <button
          type="button"
          onClick={onFilterClick}
          aria-label="Фильтры"
          className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center relative active:scale-95 transition-transform shrink-0"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1.5px solid var(--gray-200)",
          }}
        >
          <FunnelIcon />
          {filterActiveCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-[10px] font-bold flex items-center justify-center px-1 tabular-nums"
              style={{ background: "var(--green-500)", color: "white" }}
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
      <circle cx="11" cy="11" r="7.5" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function FunnelIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    </svg>
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
