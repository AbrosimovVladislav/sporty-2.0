"use client";

import { useEffect, useState } from "react";
import CitySelect from "@/components/CitySelect";
import DistrictSelect from "@/components/DistrictSelect";

type Venue = {
  id: string;
  name: string;
  address: string;
  city: string;
  district: { id: string; name: string } | null;
};

export default function VenuesTab() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [venues, setVenues] = useState<Venue[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      const q = query.trim();
      if (q) {
        params.set("q", q);
      } else {
        if (city.trim()) params.set("city", city.trim());
        if (districtId) params.set("district_id", districtId);
      }
      fetch(`/api/venues${params.toString() ? `?${params}` : ""}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled) setVenues(d.venues ?? []);
        })
        .catch(() => {
          if (!cancelled) setVenues([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, city, districtId]);

  function handleCityChange(newCity: string) {
    setCity(newCity);
    setDistrictId("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по названию…"
          className="bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
        />
        {!query && (
          <>
            <CitySelect value={city} onChange={handleCityChange} />
            <DistrictSelect city={city} value={districtId} onChange={setDistrictId} />
          </>
        )}
      </div>

      {venues === null ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Загружаю…
        </div>
      ) : venues.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Площадок не найдено
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {venues.map((v) => (
            <li
              key={v.id}
              className="bg-background-card border border-border rounded-lg p-4"
            >
              <p className="font-display font-semibold text-base">{v.name}</p>
              <p className="text-sm text-foreground-secondary mt-0.5">{v.address}</p>
              <p className="text-xs text-foreground-secondary mt-1">
                {v.city}{v.district ? ` · ${v.district.name}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
