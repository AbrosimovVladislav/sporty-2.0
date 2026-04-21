"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import CitySelect from "@/components/CitySelect";
import DistrictSelect from "@/components/DistrictSelect";
import { SkeletonList } from "@/components/Skeleton";
import { usePaginatedList } from "@/lib/usePaginatedList";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";

type Section = "mine" | "all";

type MyTeam = {
  id: string;
  name: string;
  city: string;
  sport: string;
  role: "organizer" | "player";
};

type PublicTeam = {
  id: string;
  name: string;
  city: string;
  sport: string;
  description: string | null;
  district: { id: string; name: string } | null;
};

const SPORT_LABEL: Record<string, string> = {
  football: "Футбол",
};

export default function TeamsPage() {
  const auth = useAuth();
  const [section, setSection] = useState<Section>("mine");

  if (auth.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-6 gap-6">
      <div className="bg-background-dark text-foreground-on-dark rounded-lg p-6">
        <p className="text-foreground-on-dark-muted text-sm uppercase font-display">Команды</p>
        <h1 className="text-3xl font-display font-bold uppercase mt-1">
          {section === "mine" ? "Мои команды" : "Все команды"}
        </h1>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setSection("mine")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            section === "mine"
              ? "bg-primary text-primary-foreground"
              : "bg-background-card text-foreground border border-border"
          }`}
        >
          Мои
        </button>
        <button
          onClick={() => setSection("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            section === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-background-card text-foreground border border-border"
          }`}
        >
          Все
        </button>
      </div>

      {section === "mine" ? (
        <MineSection
          userId={auth.status === "authenticated" ? auth.user.id : null}
          onFindTeams={() => setSection("all")}
        />
      ) : (
        <AllSection />
      )}
    </div>
  );
}

function MineSection({
  userId,
  onFindTeams,
}: {
  userId: string | null;
  onFindTeams: () => void;
}) {
  const [teams, setTeams] = useState<MyTeam[] | null>(null);

  useEffect(() => {
    if (!userId) {
      setTeams([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/users/${userId}/teams`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setTeams(d.teams ?? []);
      })
      .catch(() => {
        if (!cancelled) setTeams([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {teams === null ? (
        <SkeletonList count={2} />
      ) : teams.length === 0 ? (
        <>
          <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
            Ты пока не в команде
          </div>
          <button
            onClick={onFindTeams}
            className="w-full bg-primary text-primary-foreground font-display font-semibold uppercase rounded-full px-6 py-3 transition-colors hover:bg-primary-hover"
          >
            Найти команду
          </button>
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          {teams.map((t) => (
            <li key={t.id}>
              <Link
                href={`/team/${t.id}`}
                className="block bg-background-card border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-semibold text-lg">{t.name}</h2>
                  <RoleBadge role={t.role} />
                </div>
                <p className="text-sm text-foreground-secondary mt-1">
                  {t.city} · {SPORT_LABEL[t.sport] ?? t.sport}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto text-center">
        <Link
          href="/teams/create"
          className="text-sm text-foreground-secondary underline underline-offset-4"
        >
          Создать свою команду
        </Link>
      </div>
    </div>
  );
}

function AllSection() {
  const [city, setCity] = useState("");
  const [districtId, setDistrictId] = useState("");

  const fetcher = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      if (city.trim()) params.set("city", city.trim());
      if (districtId) params.set("district_id", districtId);
      params.set("offset", String(offset));
      return fetch(`/api/teams?${params}`)
        .then((r) => r.json())
        .then((d) => ({ items: (d.teams ?? []) as PublicTeam[], nextOffset: d.nextOffset as number | null }));
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
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label className="text-sm text-foreground-secondary">Город</label>
        <CitySelect value={city} onChange={handleCityChange} />
        <DistrictSelect city={city} value={districtId} onChange={setDistrictId} />
      </div>

      {teams.length === 0 && loading ? (
        <SkeletonList count={3} />
      ) : teams.length === 0 ? (
        <div className="bg-background-card border border-border rounded-lg p-6 text-center text-foreground-secondary text-sm">
          Команд не найдено
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
                  <h2 className="font-display font-semibold text-lg">{t.name}</h2>
                  <p className="text-sm text-foreground-secondary mt-1">
                    {t.city}
                    {t.district ? ` · ${t.district.name}` : ""} · {SPORT_LABEL[t.sport] ?? t.sport}
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

function RoleBadge({ role }: { role: "organizer" | "player" }) {
  const label = role === "organizer" ? "Организатор" : "Игрок";
  return (
    <span className="text-xs uppercase font-display px-2 py-1 rounded bg-primary/10 text-primary">
      {label}
    </span>
  );
}
