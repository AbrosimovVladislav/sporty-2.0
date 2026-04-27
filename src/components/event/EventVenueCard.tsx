"use client";

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
        className="rounded-2xl px-4 py-4 flex items-center gap-3"
        style={{ background: "var(--bg-card)", border: "1.5px solid var(--gray-200)" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--green-50)", color: "var(--green-600)" }}
        >
          <PinIcon />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {venue.name}
          </p>
          <p className="text-[13px] mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
            {venue.address}
          </p>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold rounded-full px-3 py-1.5 shrink-0"
          style={{ background: "var(--green-50)", color: "var(--green-700)" }}
        >
          <RouteIcon />
          Маршрут
        </a>
      </div>
    </section>
  );
}

function PinIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}
