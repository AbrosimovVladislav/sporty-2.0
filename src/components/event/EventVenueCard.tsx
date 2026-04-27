"use client";

import Image from "next/image";

type Props = {
  venue: { id: string; name: string; address: string; photo_url: string | null };
};

export function EventVenueCard({ venue }: Props) {
  const mapsUrl = `https://2gis.kz/almaty/search/${encodeURIComponent(venue.address)}`;

  return (
    <section id="venue" className="px-4 mt-6">
      <p
        className="text-[11px] font-semibold uppercase mb-2 px-1"
        style={{ letterSpacing: "0.06em", color: "var(--text-tertiary)" }}
      >
        Площадка
      </p>
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1.5px solid var(--gray-200)" }}
      >
        <div className="relative h-[140px] w-full">
          {venue.photo_url ? (
            <Image
              src={venue.photo_url}
              alt={venue.name}
              fill
              sizes="100vw"
              className="object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(135deg, var(--gray-200), var(--gray-400))" }}
            />
          )}
        </div>
        <div className="px-4 py-3">
          <p className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
            {venue.name}
          </p>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
            {venue.address}
          </p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-[13px] font-semibold"
            style={{ color: "var(--green-500)" }}
          >
            <RouteIcon />
            Маршрут
          </a>
        </div>
      </div>
    </section>
  );
}

function RouteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}
