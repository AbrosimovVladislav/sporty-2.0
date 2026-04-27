"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { formatCountdown, formatCountdownLabel } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  planned: "Запланировано",
  completed: "Завершено",
  cancelled: "Отменено",
};

type Props = {
  type: string;
  status: string;
  date: string;
  photoUrl: string | null;
};

export function EventHero({ type, status, date, photoUrl }: Props) {
  const router = useRouter();
  const isPlanned = status === "planned";

  const statusBg =
    status === "cancelled"
      ? "rgba(239,68,68,0.85)"
      : status === "completed"
        ? "rgba(255,255,255,0.85)"
        : "rgba(255,255,255,0.2)";
  const statusColor = status === "completed" ? "var(--gray-700)" : "white";

  return (
    <div
      className="relative overflow-hidden"
      style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
    >
      <div className="relative h-[220px] w-full">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
            style={{ filter: "brightness(0.85) contrast(1.05)" }}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, var(--gray-700), var(--gray-900))" }}
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.05) 35%, rgba(0,0,0,0.65) 100%)",
          }}
        />

        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Назад"
          className="absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform active:scale-95"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <BackIcon />
        </button>

        <div className="absolute left-4 bottom-4 flex gap-1.5">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
            style={{ background: "white", color: "var(--green-700)" }}
          >
            {EVENT_TYPE_LABEL[type] ?? type}
          </span>
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-sm"
            style={{ background: statusBg, color: statusColor }}
          >
            {STATUS_LABEL[status] ?? status}
          </span>
        </div>

        {isPlanned && (
          <div className="absolute right-4 bottom-3 flex items-baseline gap-1">
            <span
              className="font-display text-[28px] font-bold leading-none text-white"
              style={{ textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}
            >
              {formatCountdown(date)}
            </span>
            <span
              className="text-[12px] text-white/80"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
            >
              {formatCountdownLabel(date)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

