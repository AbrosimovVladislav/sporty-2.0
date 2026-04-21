"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CitySelect from "@/components/CitySelect";
import DistrictSelect from "@/components/DistrictSelect";
import { SkeletonList } from "@/components/Skeleton";
import { usePaginatedList } from "@/lib/usePaginatedList";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";

type SearchTeam = {
  id: string;
  name: string;
  sport: string;
  city: string;
  description: string | null;
  looking_for_players: boolean;
  members_count: number;
  district: { id: string; name: string } | null;
};

const SPORT_LABEL: Record<string, string> = {
  football: "Футбол",
};

function membersLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} игрок`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} игрока`;
  return `${n} игроков`;
}

export default function TeamsTab() {
  const [city, setCity] = useState("");
  const [districtId, setDistrictId] = useState("");

  const fetcher = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      params.set("looking_for_players", "true");
      if (city.trim()) params.set("city", city.trim());
      if (districtId) params.set("district_id", districtId);
      params.set("offset", String(offset));
      return fetch(`/api/teams?${params}`)
        .then((r) => r.json())
        .then((d) => ({ items: (d.teams ?? []) as SearchTeam[], nextOffset: d.nextOffset as number | null }));
    },
    [city, districtId],
  );

  const { items: teams, loading, loadMore, hasMore, reset } = usePaginatedList(fetcher);

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

      {teams.length === 0 && loading ? (
        <SkeletonList count={3} />
      ) : teams.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Команд, ищущих игроков, не найдено
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {teams.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/team/${t.id}`}
                  className="block bg-background-card border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-display font-semibold text-lg">{t.name}</h2>
                    <span className="text-xs font-display uppercase px-2 py-1 rounded bg-primary/10 text-primary">
                      Набор открыт
                    </span>
                  </div>
                  <p className="text-sm text-foreground-secondary mt-1">
                    {t.city}
                    {t.district ? ` · ${t.district.name}` : ""} · {SPORT_LABEL[t.sport] ?? t.sport}
                  </p>
                  <p className="text-xs text-foreground-secondary mt-1">
                    {membersLabel(t.members_count)}
                  </p>
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
