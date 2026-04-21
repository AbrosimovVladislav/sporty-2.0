"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CitySelect from "@/components/CitySelect";
import DistrictSelect from "@/components/DistrictSelect";
import { SkeletonList } from "@/components/Skeleton";
import { usePaginatedList } from "@/lib/usePaginatedList";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";

type Player = {
  id: string;
  name: string;
  city: string | null;
  position: string | null;
  skill_level: string | null;
  looking_for_team: boolean;
  district: { id: string; name: string } | null;
};

export default function PlayersPage() {
  const [city, setCity] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [lookingForTeam, setLookingForTeam] = useState(false);
  const [position, setPosition] = useState("");
  const [debouncedPosition, setDebouncedPosition] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedPosition(position), 300);
    return () => clearTimeout(t);
  }, [position]);

  const fetcher = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      if (city.trim()) params.set("city", city.trim());
      if (districtId) params.set("district_id", districtId);
      if (lookingForTeam) params.set("looking_for_team", "true");
      if (debouncedPosition.trim()) params.set("position", debouncedPosition.trim());
      params.set("offset", String(offset));
      return fetch(`/api/players?${params}`)
        .then((r) => r.json())
        .then((d) => ({ items: (d.players ?? []) as Player[], nextOffset: d.nextOffset as number | null }));
    },
    [city, districtId, lookingForTeam, debouncedPosition],
  );

  const { items: players, loading, loadMore, hasMore, reset } = usePaginatedList(fetcher);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, districtId, lookingForTeam, debouncedPosition]);

  function handleCityChange(newCity: string) {
    setCity(newCity);
    setDistrictId("");
  }

  return (
    <div className="flex flex-1 flex-col p-4 gap-4">
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-5">
        <p className="text-foreground-on-dark-muted text-xs uppercase font-display tracking-wide">
          Каталог
        </p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">Игроки</h1>
      </div>

      <div className="flex flex-col gap-2">
        <CitySelect value={city} onChange={handleCityChange} />
        <DistrictSelect city={city} value={districtId} onChange={setDistrictId} />
        <input
          type="text"
          placeholder="Позиция (нападающий, вратарь…)"
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="w-full bg-background-card border border-border rounded-lg px-4 py-2.5 text-sm placeholder:text-foreground-secondary focus:outline-none"
        />
        <button
          onClick={() => setLookingForTeam((v) => !v)}
          className={`self-start rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            lookingForTeam
              ? "bg-primary text-primary-foreground"
              : "bg-background-card text-foreground border border-border"
          }`}
        >
          Ищет команду
        </button>
      </div>

      {players.length === 0 && loading ? (
        <SkeletonList count={3} />
      ) : players.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-foreground-secondary text-sm">Игроки не найдены</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {players.map((p) => (
              <Link key={p.id} href={`/players/${p.id}`}>
                <div className="bg-background-card border border-border rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-display font-semibold">{p.name}</p>
                    <p className="text-xs text-foreground-secondary mt-0.5">
                      {[
                        p.city && p.district ? `${p.city} · ${p.district.name}` : p.city,
                        p.position,
                        p.skill_level,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {p.looking_for_team && (
                    <span className="text-xs font-medium bg-primary/10 text-primary rounded-full px-2.5 py-1 shrink-0 ml-3">
                      Ищет команду
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
          {hasMore && <InfiniteScrollSentinel onVisible={loadMore} />}
        </>
      )}
    </div>
  );
}
