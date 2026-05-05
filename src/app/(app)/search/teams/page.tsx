"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";
import { SkeletonList } from "@/components/Skeleton";
import {
  PageHeader,
  HeaderIconButton,
  ListSearchBar,
  ListMeta,
  EmptyState,
  CityPickerSheet,
} from "@/components/ui";
import { SearchSubnav } from "@/components/search/SearchSubnav";
import { TeamListRow } from "@/components/teams/TeamListRow";
import {
  TeamFiltersSheet,
  type TeamFilters,
} from "@/components/teams/TeamFiltersSheet";
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

  const sheetActiveCount =
    (filters.districtId ? 1 : 0) +
    (filters.sport ? 1 : 0) +
    (filters.lookingForPlayers ? 1 : 0);

  const showSkeleton = teams.length === 0 && teamsQuery.isPending;
  const showEmpty = !loading && teams.length === 0;
  const countLabel = total != null ? `Результаты · ${total}` : null;

  const cityForPicker = filters.city || activeCity;

  return (
    <div className="flex flex-1 flex-col" style={{ background: "var(--card)" }}>
      <PageHeader
        title="Команды"
        actions={
          <HeaderIconButton ariaLabel="Уведомления">
            <BellIcon />
          </HeaderIconButton>
        }
      />

      <SearchSubnav />

      <div className="px-4 pt-3.5 pb-2">
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
      </div>

      <div className="px-4 pt-3 pb-2">
        <ListMeta
          countLabel={countLabel}
          sort={{
            value: sort,
            options: SORT_OPTIONS,
            onChange: (v) => setSort(v as TeamSort),
          }}
        />
      </div>

      <div className="flex-1">
        {showSkeleton ? (
          <div className="px-4 py-3">
            <SkeletonList count={6} />
          </div>
        ) : showEmpty ? (
          <div className="py-10 px-4">
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
                    border: "2.5px solid var(--ink-200)",
                    borderTopColor: "var(--green-700)",
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

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 8a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <path d="M10 18a2 2 0 0 0 4 0" />
    </svg>
  );
}
