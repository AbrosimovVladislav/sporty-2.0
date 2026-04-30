"use client";

import Link from "next/link";

type Props = {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string | null;
};

export function VenueListRow({ id, name, address, city, district }: Props) {
  const subtitle = [address, district || null].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/venues/${id}`}
      className="w-full flex items-center gap-3.5 py-3 text-left transition-colors active:bg-bg-secondary"
      style={{ borderBottom: "1px solid var(--gray-100)" }}
    >
      <div
        className="w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0"
        style={{
          background: "var(--bg-card)",
          border: "1.5px solid var(--gray-200)",
          color: "var(--text-tertiary)",
        }}
      >
        <PinIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[15px] font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {name}
        </p>
        {subtitle && (
          <p
            className="text-[13px] truncate mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {subtitle}
          </p>
        )}
        <p
          className="text-[11px] truncate mt-0.5"
          style={{ color: "var(--text-tertiary)" }}
        >
          {city}
        </p>
      </div>
    </Link>
  );
}

function PinIcon() {
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
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
