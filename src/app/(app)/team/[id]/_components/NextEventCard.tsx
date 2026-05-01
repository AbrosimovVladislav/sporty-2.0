import Link from "next/link";
import Image from "next/image";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import {
  formatCountdown,
  formatCountdownLabel,
  formatPrice,
} from "@/lib/format";
import { CalendarIcon, CheckIcon, PinIcon } from "./icons";
import type { Insights } from "./types";

export function NextEventCard({
  insights,
  teamId,
}: {
  insights: Insights | null | undefined;
  teamId: string;
}) {
  if (insights === undefined) {
    return (
      <div
        className="rounded-[20px] h-[224px] animate-pulse"
        style={{ background: "var(--bg-card)" }}
      />
    );
  }
  if (!insights || !insights.nextEvent) {
    return (
      <div
        className="rounded-[20px] p-5 flex items-center gap-4"
        style={{ background: "var(--bg-primary)", border: "1px solid var(--gray-100)" }}
      >
        <span
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "var(--bg-card)", color: "var(--text-tertiary)" }}
        >
          <CalendarIcon />
        </span>
        <div className="flex-1">
          <p
            className="text-[15px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Нет ближайших событий
          </p>
          <Link
            href={`/team/${teamId}/events`}
            className="text-[13px] font-semibold mt-1 inline-block"
            style={{ color: "var(--green-600)" }}
          >
            Создать событие →
          </Link>
        </div>
      </div>
    );
  }

  const e = insights.nextEvent;
  const cd = formatCountdown(e.date);
  const cdLabel = formatCountdownLabel(e.date);
  const countdownText = cdLabel ? `${cd} ${cdLabel}` : cd;
  const dateStr = new Date(e.date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  const timeStr = new Date(e.date).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/team/${teamId}/events/${e.id}`}
      className="block rounded-[20px] overflow-hidden"
      style={{ background: "var(--gray-900)" }}
    >
      <div className="relative h-[120px] w-full">
        {e.venue?.photoUrl ? (
          <Image
            src={e.venue.photoUrl}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, var(--gray-700), var(--gray-900))",
            }}
          />
        )}
        <div
          className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 35%, var(--gray-900) 100%)",
          }}
        />
        <div
          className="absolute left-3 bottom-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm"
          style={{ background: "rgba(0,0,0,0.55)", color: "white" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--green-500)" }}
          />
          {countdownText}
        </div>
      </div>
      <div className="px-4 pt-2 pb-4">
        <h2 className="font-display text-[22px] font-bold uppercase leading-none text-white">
          {EVENT_TYPE_LABEL[e.type] ?? e.type}
        </h2>
        <p
          className="text-[13px] mt-1.5 capitalize"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          {dateStr} · {timeStr}
        </p>
        <div className="flex items-center gap-3 mt-3">
          {e.venue && (
            <span
              className="text-[12px] inline-flex items-center gap-1"
              style={{ color: "rgba(255,255,255,0.65)" }}
            >
              <PinIcon />
              {e.venue.name}
            </span>
          )}
          <span
            className="text-[12px] inline-flex items-center gap-1.5 ml-auto"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            <CheckIcon />
            <span className="font-semibold tabular-nums">
              {e.yesCount}
              {e.totalMembers > 0 ? ` / ${e.totalMembers}` : ""}
            </span>
          </span>
          {e.pricePerPlayer > 0 && (
            <span
              className="text-[12px] font-semibold tabular-nums"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              {formatPrice(e.pricePerPlayer)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
