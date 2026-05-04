import { EventListRow } from "@/components/events/EventListRow";
import type { EventItem } from "./types";

export function EventsSection({
  title,
  events,
  teamId,
  teamName,
  muted,
}: {
  title: string;
  events: EventItem[];
  teamId: string;
  teamName: string | null;
  muted?: boolean;
}) {
  if (events.length === 0) return null;
  return (
    <section className="mb-5">
      <p
        className="text-[11px] font-bold uppercase mb-3 px-0.5"
        style={{
          letterSpacing: "0.06em",
          color: muted ? "var(--text-tertiary)" : "var(--text-secondary)",
        }}
      >
        {title} · {events.length}
      </p>
      <ul>
        {events.map((e) => (
          <li key={e.id}>
            <EventListRow
              id={e.id}
              teamId={teamId}
              teamName={teamName}
              type={e.type}
              date={e.date}
              venueName={e.venue?.name ?? null}
              venueAddress={e.venue?.address ?? null}
              yesCount={e.yesCount}
              pricePerPlayer={e.price_per_player}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
