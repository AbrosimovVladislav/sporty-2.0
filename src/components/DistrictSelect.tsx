"use client";

import { useEffect, useState } from "react";

type District = { id: string; name: string };

type Props = {
  city: string;
  value: string;
  onChange: (districtId: string) => void;
  className?: string;
};

export default function DistrictSelect({ city, value, onChange, className }: Props) {
  const [districts, setDistricts] = useState<District[]>([]);

  useEffect(() => {
    if (!city) {
      setDistricts([]);
      onChange("");
      return;
    }
    const params = new URLSearchParams({ city });
    fetch(`/api/districts?${params}`)
      .then((r) => r.json())
      .then((d) => setDistricts(d.districts ?? []))
      .catch(() => setDistricts([]));
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!city || districts.length === 0) return null;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        "bg-background-card border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
      }
    >
      <option value="">Любой район</option>
      {districts.map((d) => (
        <option key={d.id} value={d.id}>
          {d.name}
        </option>
      ))}
    </select>
  );
}
