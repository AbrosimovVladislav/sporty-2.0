"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePaginatedList } from "@/lib/usePaginatedList";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";
import { SkeletonList } from "@/components/Skeleton";
import {
  PageHeader,
  HeaderStatGroup,
  HeaderStat,
  ListSearchBar,
  ListMeta,
  ActiveFilterChips,
  EmptyState,
  type FilterChip,
} from "@/components/ui";
import { SearchSubnav } from "@/components/search/SearchSubnav";
import { TeamListRow } from "@/components/teams/TeamListRow";
import {
  TeamFiltersSheet,
  type TeamFilters,
} from "@/components/teams/TeamFiltersSheet";
import { SPORT_LABEL } from "@/lib/catalogs";
import { useCity } from "@/lib/city-context";

type Team = {
  id: string;
  name: string;
  sport: string;
  city: string;
  description: string | null;
  created_at: string;
  looking_for_players: boolean;
  district_id: string | null;
  logo_url: string | null;
  district: { id: string; name: string } | null;
  members_count: number;
};

type Stats = {
  total: number;
  mine: number | null;
  lookingForPlayers: number;
};

const EMPTY_FILTERS: TeamFilters = {
  city: "",
  districtId: "",
  sport: "",
  lookingForPlayers: false,
};

function pluralTeams(n: number): string {
  const m = n % 10;
  const tens = n % 100;
  if (tens >= 11 && tens <= 14) return "команд";
  if (m === 1) return "команда";
  if (m >= 2 && m <= 4) return "команды";
  return "команд";
}

export default function SearchTeamsPage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const { activeCity } = useCity();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<TeamFilters>(EMPTY_FILTERS);

  useEffect(() => {
    setFilters((f) => ({ ...f, city: activeCity }));
  }, [activeCity]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [myTeamIds, setMyTeamIds] = useState<Set<string>>(new Set());
  const [myRoles, setMyRoles] = useState<
    Record<string, "organizer" | "player">
  >({});

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    if (filters.sport) params.set("sport", filters.sport);
    fetch(`/api/teams/stats?${params}`)
      .then((r) => r.json())
      .then((d: Stats) => {
        if (!cancelled) setStats(d);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.city, filters.sport]);

  useEffect(() => {
    if (!userId) {
      setMyTeamIds(new Set());
      setMyRoles({});
      return;
    }
    let cancelled = false;
    fetch(`/api/users/${userId}/teams`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          const teams = (d.teams ?? []) as {
            id: string;
            role: "organizer" | "player";
          }[];
          setMyTeamIds(new Set(teams.map((t) => t.id)));
          setMyRoles(Object.fromEntries(teams.map((t) => [t.id, t.role])));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const fetcher = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (filters.city) params.set("city", filters.city);
      if (filters.districtId) params.set("district_id", filters.districtId);
      if (filters.sport) params.set("sport", filters.sport);
      if (filters.lookingForPlayers) params.set("looking_for_players", "true");
      params.set("offset", String(offset));
      return fetch(`/api/teams?${params}`)
        .then((r) => r.json())
        .then((d) => ({
          items: (d.teams ?? []) as Team[],
          nextOffset: d.nextOffset as number | null,
          total: d.total as number | null,
        }));
    },
    [
      debouncedSearch,
      filters.city,
      filters.districtId,
      filters.sport,
      filters.lookingForPlayers,
    ],
  );

  const { items: teams, loading, loadMore, hasMore, reset } =
    usePaginatedList<Team>(fetcher);
  const [resultsTotal, setResultsTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filters.city) params.set("city", filters.city);
    if (filters.districtId) params.set("district_id", filters.districtId);
    if (filters.sport) params.set("sport", filters.sport);
    if (filters.lookingForPlayers) params.set("looking_for_players", "true");
    params.set("limit", "1");
    fetch(`/api/teams?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled)
          setResultsTotal(typeof d.total === "number" ? d.total : null);
      })
      .catch(() => {
        if (!cancelled) setResultsTotal(null);
      });
    reset();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    filters.city,
    filters.districtId,
    filters.sport,
    filters.lookingForPlayers,
  ]);

  const activeChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (filters.city) {
      chips.push({
        id: "city",
        label: filters.city,
        onRemove: () =>
          setFilters((f) => ({ ...f, city: "", districtId: "" })),
      });
    }
    if (filters.sport) {
      chips.push({
        id: "sport",
        label: SPORT_LABEL[filters.sport] ?? filters.sport,
        onRemove: () => setFilters((f) => ({ ...f, sport: "" })),
      });
    }
    if (filters.lookingForPlayers) {
      chips.push({
        id: "looking",
        label: "Ищут игроков",
        onRemove: () =>
          setFilters((f) => ({ ...f, lookingForPlayers: false })),
      });
    }
    return chips;
  }, [filters]);

  const sheetActiveCount =
    (filters.city ? 1 : 0) +
    (filters.districtId ? 1 : 0) +
    (filters.sport ? 1 : 0) +
    (filters.lookingForPlayers ? 1 : 0);

  const showSkeleton = teams.length === 0 && loading;
  const showEmpty = !loading && teams.length === 0;

  const countLabel =
    resultsTotal === null
      ? "Загружаем…"
      : `Найдено ${resultsTotal} ${pluralTeams(resultsTotal)}`;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Команды">
        <HeaderStatGroup>
          <HeaderStat value={stats?.total ?? "—"} label="Всего" />
          <HeaderStat
            value={stats?.lookingForPlayers ?? "—"}
            label="Ищут игроков"
          />
        </HeaderStatGroup>
      </PageHeader>

      <SearchSubnav />

      <div className="px-4 mt-3.5">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          onFilterClick={() => setSheetOpen(true)}
          filterActiveCount={sheetActiveCount}
          placeholder="Имя команды, город…"
        />

        <ListMeta countLabel={countLabel} />

        {activeChips.length > 0 && (
          <ActiveFilterChips chips={activeChips} className="mt-1.5" />
        )}
      </div>

      <div className="px-4 mt-5">
        {showSkeleton ? (
          <SkeletonList count={5} />
        ) : showEmpty ? (
          <div className="py-10">
            <EmptyState
              text="По выбранным фильтрам команд не нашли"
              action={{
                label: "Сбросить фильтры",
                onClick: () => {
                  setSearch("");
                  setFilters({ ...EMPTY_FILTERS, city: activeCity });
                },
              }}
            />
          </div>
        ) : (
          <>
            {resultsTotal !== null && resultsTotal > 0 && (
              <p
                className="text-[11px] font-semibold uppercase mb-1"
                style={{
                  letterSpacing: "0.06em",
                  color: "var(--text-tertiary)",
                }}
              >
                Результаты · {resultsTotal}
              </p>
            )}
            <ul className="flex flex-col">
              {teams.map((t) => (
                <li key={t.id}>
                  <TeamListRow
                    id={t.id}
                    name={t.name}
                    sport={t.sport}
                    city={t.city}
                    district={t.district?.name ?? null}
                    membersCount={t.members_count}
                    lookingForPlayers={t.looking_for_players}
                    myRole={myTeamIds.has(t.id) ? myRoles[t.id] ?? null : null}
                    logoUrl={t.logo_url}
                  />
                </li>
              ))}
            </ul>
            {hasMore && <InfiniteScrollSentinel onVisible={loadMore} />}
          </>
        )}
      </div>

      <TeamFiltersSheet
        open={sheetOpen}
        initial={filters}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => setFilters(next)}
      />
    </div>
  );
}
