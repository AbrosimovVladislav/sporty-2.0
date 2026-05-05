"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { formatMoney } from "@/lib/format";

const PHOTO_W = 84;
const PHOTO_H = 78;

export type VenueType = "open" | "indoor" | "covered";

const TYPE_LABEL: Record<VenueType, string> = {
  open: "Открытое",
  indoor: "Манеж",
  covered: "Крытое",
};

const TYPE_COLOR: Record<VenueType, { bg: string; fg: string }> = {
  open:    { bg: "var(--green-50)",   fg: "var(--green-700)" },
  indoor:  { bg: "var(--pos-gk-bg)",  fg: "var(--pos-gk-fg)" },
  covered: { bg: "var(--warning-soft)", fg: "var(--warning)" },
};

type Props = {
  id: string;
  name: string;
  address: string;
  city: string;
  district?: string | null;
  photoUrl?: string | null;
  /** Минимальная стоимость аренды; рендерится как «от X ₸». */
  priceFrom?: number | null;
  /** Тип покрытия — рендерится цветной плашкой. */
  type?: VenueType | null;
  /** Формат площадки, например "7×7". */
  format?: string | null;
  /** Рейтинг 0..5 — рендерится как «★ 4.9». */
  rating?: number | null;
};

function VenueListRowImpl({
  id,
  name,
  address,
  photoUrl,
  priceFrom,
  type,
  format,
  rating,
}: Props) {
  const typeColor = type ? TYPE_COLOR[type] : null;
  const typeLabel = type ? TYPE_LABEL[type] : null;

  return (
    <Link
      href={`/venues/${id}`}
      className="flex items-center gap-3.5 px-4 py-3 last:border-b-0 transition-colors active:bg-bg-secondary"
      style={{ borderBottom: "1px solid var(--ink-100)" }}
    >
      <VenuePhoto src={photoUrl} alt={name} />

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <h3
          className="text-[16px] font-semibold truncate leading-[1.2]"
          style={{ color: "var(--ink-900)" }}
        >
          {name}
        </h3>
        {(typeLabel || format) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {typeLabel && typeColor && (
              <Tag bg={typeColor.bg} fg={typeColor.fg}>{typeLabel}</Tag>
            )}
            {format && (
              <Tag bg="var(--ink-100)" fg="var(--ink-700)">{format}</Tag>
            )}
          </div>
        )}
        {address && (
          <p
            className="text-[13px] truncate"
            style={{ color: "var(--ink-500)" }}
          >
            {address}
          </p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end justify-center gap-1">
        {priceFrom != null && priceFrom > 0 && (
          <span
            className="text-[14px] font-bold tabular-nums"
            style={{ color: "var(--ink-900)" }}
          >
            от {formatMoney(priceFrom)}
          </span>
        )}
        {rating != null && (
          <span
            className="inline-flex items-center gap-1 text-[13px] font-semibold tabular-nums"
            style={{ color: "var(--pos-gk-fg)" }}
          >
            <StarIcon />
            {rating.toFixed(1)}
          </span>
        )}
      </div>

      <ChevronRight />
    </Link>
  );
}

export const VenueListRow = memo(VenueListRowImpl);

function VenuePhoto({ src, alt }: { src?: string | null; alt: string }) {
  return (
    <div
      className="rounded-[14px] overflow-hidden flex items-center justify-center shrink-0"
      style={{
        width: PHOTO_W,
        height: PHOTO_H,
        background: "var(--ink-100)",
        color: "var(--ink-400)",
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={PHOTO_W * 2}
          height={PHOTO_H * 2}
          className="w-full h-full object-cover"
        />
      ) : (
        <PinIcon />
      )}
    </div>
  );
}

function Tag({
  bg,
  fg,
  children,
}: {
  bg: string;
  fg: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
      style={{ background: bg, color: fg, letterSpacing: "0.04em" }}
    >
      {children}
    </span>
  );
}

function PinIcon() {
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
      aria-hidden
    >
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--ink-400)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
