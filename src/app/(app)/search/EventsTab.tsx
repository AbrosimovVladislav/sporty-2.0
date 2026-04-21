"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CitySelect from "@/components/CitySelect";
import DistrictSelect from "@/components/DistrictSelect";
import { SkeletonList } from "@/components/Skeleton";
import { usePaginatedList } from "@/lib/usePaginatedList";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";

type PublicEvent = {
  id: string;
  team_id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  description: string | null;
  venue: {
    id: string;
    name: string;
    address: string;
    city: string;
    district: { id: string; name: string } | null;
  } | null;
  team: { id: string; name: string; city: string } | null;
  yes_count: number;
};

const TYPE_LABEL: Record<string, string> = {
  game: "Игра",
  training: "Тренировка",
  gathering: "Сбор",
  other: "Другое",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function EventsTab() {
  const [city, setCity] = useState("");
  const [districtId, setDistrictId] = useState("");

  const fetcher = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      if (city.trim()) params.set("city", city.trim());
      if (districtId) params.set("district_id", districtId);
      params.set("offset", String(offset));
      return fetch(`/api/events/public${params.toString() ? `?${params}` : ""}`)
        .then((r) => r.json())
        .then((d) => ({ items: (d.events ?? []) as PublicEvent[], nextOffset: d.nextOffset as number | null }));
    },
    [city, districtId],
  );

  const { items: events, loading, loadMore, hasMore, reset } = usePaginatedList(fetcher);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, districtId]);

  function handleCityChange(newCity: string) {
    setCity(newCity);
    setDistrictId("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <CitySelect value={city} onChange={handleCityChange} />
        <DistrictSelect city={city} value={districtId} onChange={setDistrictId} />
      </div>

      {events.length === 0 && loading ? (
        <SkeletonList count={3} />
      ) : events.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Публичных событий не найдено
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {events.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/team/${e.team_id}/events/${e.id}`}
                  className="block bg-background-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-display font-semibold uppercase px-2 py-1 rounded bg-primary/10 text-primary">
                      {TYPE_LABEL[e.type] ?? e.type}
                    </span>
                    <span className="text-xs text-foreground-secondary">{formatDate(e.date)}</span>
                  </div>
                  {e.team && (
                    <p className="font-display font-semibold text-base">{e.team.name}</p>
                  )}
                  {e.venue && (
                    <p className="text-sm text-foreground-secondary mt-0.5">
                      {e.venue.name}
                      {e.venue.district ? ` · ${e.venue.district.name}` : ""}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-foreground-secondary">
                    <span>{e.yes_count} {e.yes_count === 1 ? "идёт" : "идут"}</span>
                    {e.min_players > 1 && <span>мин. {e.min_players}</span>}
                    {e.price_per_player > 0 && <span>{e.price_per_player} ₽</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {hasMore && <InfiniteScrollSentinel onVisible={loadMore} />}
        </>
      )}
    </div>
  );
}
