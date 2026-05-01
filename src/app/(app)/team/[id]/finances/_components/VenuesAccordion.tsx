import Link from "next/link";
import { useState } from "react";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { formatMoney, pluralize } from "@/lib/format";
import type { FinancesData } from "./types";

export function VenuesAccordion({
  teamId,
  events,
}: {
  teamId: string;
  events: FinancesData["venueEvents"];
}) {
  const [open, setOpen] = useState(false);
  const totalCost = events.reduce((s, e) => s + e.cost, 0);
  const totalPaid = events.reduce((s, e) => s + e.paid, 0);
  const totalDebt = Math.max(0, totalCost - totalPaid);

  return (
    <div className="bg-bg-primary rounded-[16px] overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-4 text-left gap-3"
      >
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[14px] font-semibold leading-tight text-text-primary">
            Площадки · {events.length}{" "}
            {pluralize(events.length, ["событие", "события", "событий"])}
          </span>
          <span
            className="text-[11px] mt-1"
            style={{ color: "var(--text-tertiary)" }}
          >
            Оплачено {formatMoney(totalPaid)} из {formatMoney(totalCost)}
            {totalDebt > 0 && (
              <>
                {" "}
                · долг{" "}
                <span style={{ color: "var(--danger)" }}>
                  {formatMoney(totalDebt)}
                </span>
              </>
            )}
          </span>
        </div>
        <span
          className="shrink-0 transition-transform"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0)",
            color: "var(--text-secondary)",
          }}
        >
          <ChevronDownIcon />
        </span>
      </button>
      {open && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {events.map((v) => {
            const date = new Date(v.date).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            });
            const remain = v.cost - v.paid;
            return (
              <li key={v.eventId}>
                <Link
                  href={`/team/${teamId}/events/${v.eventId}`}
                  className="flex items-center justify-between py-3 px-4 gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate">
                      {EVENT_TYPE_LABEL[v.type] ?? v.type} · {date}
                    </p>
                    {v.venueName && (
                      <p className="text-[12px] text-text-secondary mt-0.5 truncate">
                        {v.venueName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[14px] font-semibold tabular-nums shrink-0 ${
                      remain > 0 ? "text-danger" : "text-text-secondary"
                    }`}
                  >
                    {remain > 0 ? `−${formatMoney(remain)}` : "оплачено"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ChevronDownIcon() {
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
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
