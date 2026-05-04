"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";
import { SkeletonList } from "@/components/Skeleton";
import {
  PageHeader,
  ListSearchBar,
  ListMeta,
  ActiveFilterChips,
  EmptyState,
  CityPickerSheet,
  type FilterChip,
} from "@/components/ui";
import { SearchSubnav } from "@/components/search/SearchSubnav";
import { TeamListRow } from "@/components/teams/TeamListRow";
import {
  TeamFiltersSheet,
  type TeamFilters,
} from "@/components/teams/TeamFiltersSheet";
import { SPORT_LABEL } from "@/lib/catalogs";
import { useCity, KZ_CITIES } from "@/lib/city-context";

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

type TeamSort = "created_desc" | "name_asc";

const EMPTY_FILTERS: TeamFilters = {
  city: "",
  districtId: "",
  sport: "",
  lookingForPlayers: false,
};

const SORT_OPTIONS = [
  { value: "created_desc", label: "Сначала новые" },
  { value: "name_asc", label: "По названию (А-Я)" },
];

export default function SearchTeamsPage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const { activeCity } = useCity();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<TeamFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<TeamSort>("created_desc");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const [myTeamIds, setMyTeamIds] = useState<Set<string>>(new Set());
  const [myRoles, setMyRoles] = useState<
    Record<string, "organizer" | "player">
  >({});

  useEffect(() => {
    setFilters((f) => (f.city ? f : { ...f, city: activeCity }));
  }, [activeCity]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

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

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filters.city) params.set("city", filters.city);
    if (filters.districtId) params.set("district_id", filters.districtId);
    if (filters.sport) params.set("sport", filters.sport);
    if (filters.lookingForPlayers) params.set("looking_for_players", "true");
    params.set("sort", sort);
    return params.toString();
  }, [
    debouncedSearch,
    filters.city,
    filters.districtId,
    filters.sport,
    filters.lookingForPlayers,
    sort,
  ]);

  const teamsQuery = useInfiniteQuery({
    queryKey: ["teams-search", queryString],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/teams?${queryString}&cursor=${encodeURIComponent(pageParam)}`
        : `/api/teams?${queryString}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("teams fetch failed");
      return r.json() as Promise<{
        teams: Team[];
        nextCursor: string | null;
        total?: number;
      }>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const teams = teamsQuery.data?.pages.flatMap((p) => p.teams) ?? [];
  const total = teamsQuery.data?.pages[0]?.total ?? null;
  const loading = teamsQuery.isPending || teamsQuery.isFetchingNextPage;
  const hasMore = teamsQuery.hasNextPage;
  const loadMore = () => {
    if (!teamsQuery.isFetchingNextPage) teamsQuery.fetchNextPage();
  };

  const activeChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
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
    (filters.districtId ? 1 : 0) +
    (filters.sport ? 1 : 0) +
    (filters.lookingForPlayers ? 1 : 0);

  const showSkeleton = teams.length === 0 && teamsQuery.isPending;
  const showEmpty = !loading && teams.length === 0;
  const countLabel = total != null ? `Результаты · ${total}` : null;

  const cityForPicker = filters.city || activeCity;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Команды" />

      <SearchSubnav />

      <div className="px-4 mt-3.5">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          onFilterClick={() => setSheetOpen(true)}
          filterActiveCount={sheetActiveCount}
          placeholder="Имя команды, город…"
          cityPicker={{
            value: cityForPicker,
            onClick: () => setCityOpen(true),
          }}
        />

        {activeChips.length > 0 && (
          <ActiveFilterChips chips={activeChips} className="mt-3.5" />
        )}
      </div>

      <div className="px-4 mt-3">
        <ListMeta
          countLabel={countLabel}
          sort={{
            value: sort,
            options: SORT_OPTIONS,
            onChange: (v) => setSort(v as TeamSort),
          }}
        />
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
            {teamsQuery.isFetchingNextPage && (
              <div className="flex justify-center py-5">
                <span
                  className="block w-6 h-6 rounded-full animate-spin"
                  style={{
                    border: "2.5px solid var(--gray-200)",
                    borderTopColor: "var(--green-500)",
                  }}
                />
              </div>
            )}
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

      <CityPickerSheet
        open={cityOpen}
        cities={KZ_CITIES}
        value={cityForPicker}
        onClose={() => setCityOpen(false)}
        onSelect={(c) =>
          setFilters((f) => ({ ...f, city: c, districtId: "" }))
        }
      />
    </div>
  );
}
