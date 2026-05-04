"use client";

import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";
import { SkeletonList } from "@/components/Skeleton";
import {
  PageHeader,
  HeaderStatGroup,
  HeaderStat,
  ListSearchBar,
  ListMeta,
  FilterPills,
  ActiveFilterChips,
  EmptyState,
  CityPickerSheet,
  type FilterChip,
} from "@/components/ui";
import { SearchSubnav } from "@/components/search/SearchSubnav";
import { PlayerListRow } from "@/components/players/PlayerListRow";
import {
  PlayerFiltersSheet,
  type PlayerFilters,
} from "@/components/players/PlayerFiltersSheet";
import { useCity, KZ_CITIES } from "@/lib/city-context";
import type { TeamLogo } from "@/components/players/badges";

type Player = {
  id: string;
  name: string;
  avatar_url: string | null;
  city: string | null;
  position: string[] | null;
  skill_level: string | null;
  looking_for_team: boolean;
  district: { id: string; name: string } | null;
  rating: number | null;
  teams: TeamLogo[];
};

type Stats = {
  total: number;
  inMyTeams: number | null;
  lookingForTeam: number;
};

type SortMode = "skill" | "recent" | "name_asc";

const POSITION_PILLS = [
  { value: "", label: "Все" },
  { value: "Вратарь", label: "ВРТ" },
  { value: "Защитник", label: "ЗАЩ" },
  { value: "Полузащитник", label: "ПЗЩ" },
  { value: "Нападающий", label: "НАП" },
];

const SORT_OPTIONS = [
  { value: "skill", label: "По уровню" },
  { value: "name_asc", label: "По имени (А-Я)" },
  { value: "recent", label: "Недавно зарегистрированные" },
];

const EMPTY_FILTERS: PlayerFilters = {
  city: "",
  districtId: "",
  lookingForTeam: false,
};


export default function SearchPlayersPage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const { activeCity } = useCity();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [positionPill, setPositionPill] = useState("");
  const [sort, setSort] = useState<SortMode>("skill");
  const [filters, setFilters] = useState<PlayerFilters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setFilters((f) => (f.city ? f : { ...f, city: activeCity }));
  }, [activeCity]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const effectivePosition = positionPill;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filters.city) params.set("city", filters.city);
    if (filters.districtId) params.set("district_id", filters.districtId);
    if (filters.lookingForTeam) params.set("looking_for_team", "true");
    if (effectivePosition) params.set("position", effectivePosition);
    params.set("sort", sort);
    return params.toString();
  }, [
    debouncedSearch,
    filters.city,
    filters.districtId,
    filters.lookingForTeam,
    effectivePosition,
    sort,
  ]);

  const playersQuery = useInfiniteQuery({
    queryKey: ["players-search", queryString],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/players?${queryString}&cursor=${encodeURIComponent(pageParam)}`
        : `/api/players?${queryString}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("players fetch failed");
      return r.json() as Promise<{ players: Player[]; nextCursor: string | null }>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const players = playersQuery.data?.pages.flatMap((p) => p.players) ?? [];
  const loading = playersQuery.isPending || playersQuery.isFetchingNextPage;
  const hasMore = playersQuery.hasNextPage;
  const loadMore = () => {
    if (!playersQuery.isFetchingNextPage) playersQuery.fetchNextPage();
  };

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
    if (filters.city) params.set("city", filters.city);
    fetch(`/api/players/stats?${params}`)
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
  }, [userId, filters.city]);

  const activeChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (filters.lookingForTeam) {
      chips.push({
        id: "looking",
        label: "Ищет команду",
        onRemove: () => setFilters((f) => ({ ...f, lookingForTeam: false })),
      });
    }
    return chips;
  }, [filters]);

  const sheetActiveCount =
    (filters.districtId ? 1 : 0) + (filters.lookingForTeam ? 1 : 0);

  const showSkeleton = players.length === 0 && playersQuery.isPending;
  const showEmpty = !loading && players.length === 0;
  const resultsLabel =
    players.length > 0 ? `${players.length}${hasMore ? "+" : ""}` : null;

  const cityForPicker = filters.city || activeCity;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Игроки">
        <HeaderStatGroup>
          <HeaderStat value={stats?.total ?? "—"} label="Всего" />
          <HeaderStat
            value={stats?.lookingForTeam ?? "—"}
            label="Ищут команду"
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
          placeholder="Имя, команда…"
          cityPicker={{
            value: cityForPicker,
            onClick: () => setCityOpen(true),
          }}
        />

        <ListMeta
          sort={{
            value: sort,
            options: SORT_OPTIONS,
            onChange: (v) => setSort(v as SortMode),
          }}
        />

        <FilterPills
          options={POSITION_PILLS}
          value={positionPill}
          onChange={setPositionPill}
        />

        {activeChips.length > 0 && (
          <ActiveFilterChips chips={activeChips} className="mt-3.5" />
        )}
      </div>

      <div className="px-4 mt-5">
        {showSkeleton ? (
          <SkeletonList count={5} />
        ) : showEmpty ? (
          <div className="py-10">
            <EmptyState
              text="По выбранным фильтрам никого не нашли"
              action={{
                label: "Сбросить фильтры",
                onClick: () => {
                  setSearch("");
                  setPositionPill("");
                  setFilters({ ...EMPTY_FILTERS, city: activeCity });
                },
              }}
            />
          </div>
        ) : (
          <>
            {resultsLabel && (
              <p
                className="text-[11px] font-semibold uppercase mb-1"
                style={{
                  letterSpacing: "0.06em",
                  color: "var(--text-tertiary)",
                }}
              >
                Результаты · {resultsLabel}
              </p>
            )}
            <ul className="flex flex-col">
              {players.map((p) => (
                <li key={p.id}>
                  <PlayerListRow
                    id={p.id}
                    name={p.name}
                    avatarUrl={p.avatar_url}
                    position={p.position}
                    city={p.city}
                    district={p.district?.name ?? null}
                    skillLevel={p.skill_level}
                    lookingForTeam={p.looking_for_team}
                    rating={p.rating}
                    teams={p.teams}
                  />
                </li>
              ))}
            </ul>
            {hasMore && <InfiniteScrollSentinel onVisible={loadMore} />}
          </>
        )}
      </div>

      <PlayerFiltersSheet
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
