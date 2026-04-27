"use client";

import { formatPrice, formatTime } from "@/lib/format";

type Props = {
  date: string;
  venueName: string | null;
  pricePerPlayer: number;
  onVenueClick?: () => void;
};

export function EventInfoChips({ date, venueName, pricePerPlayer, onVenueClick }: Props) {
  return (
    <div className="px-4 mt-3 flex flex-wrap gap-2">
      <Chip>
        <ClockIcon />
        <span>{formatTime(date)}</span>
      </Chip>
      {venueName && (
        <Chip onClick={onVenueClick}>
          <PinIcon />
          <span className="truncate max-w-[180px]">{venueName}</span>
        </Chip>
      )}
      <Chip>
        <CoinIcon />
        <strong className="font-semibold" style={{ color: "var(--text-primary)" }}>
          {formatPrice(pricePerPlayer)}
        </strong>
      </Chip>
    </div>
  );
}

function Chip({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[13px] rounded-full px-3 py-1.5 transition-transform active:scale-[0.97]"
      style={{
        background: "var(--bg-secondary)",
        color: "var(--text-secondary)",
        border: "1px solid var(--gray-200)",
      }}
    >
      {children}
    </Tag>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CoinIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
