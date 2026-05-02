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
  FilterPills,
  ActiveFilterChips,
  EmptyState,
  type FilterChip,
} from "@/components/ui";
import { SearchSubnav } from "@/components/search/SearchSubnav";
import { PlayerListRow } from "@/components/players/PlayerListRow";
import {
  PlayerFiltersSheet,
  type PlayerFilters,
} from "@/components/players/PlayerFiltersSheet";
import { useCity } from "@/lib/city-context";

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
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    setFilters((f) => ({ ...f, city: activeCity }));
  }, [activeCity]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const effectivePosition = positionPill;

  const fetcher = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (filters.city) params.set("city", filters.city);
      if (filters.districtId) params.set("district_id", filters.districtId);
      if (filters.lookingForTeam) params.set("looking_for_team", "true");
      if (effectivePosition) params.set("position", effectivePosition);
      params.set("sort", sort);
      params.set("offset", String(offset));
      return fetch(`/api/players?${params}`)
        .then((r) => r.json())
        .then((d) => ({
          items: (d.players ?? []) as Player[],
          nextOffset: d.nextOffset as number | null,
          total: d.total as number | null,
        }));
    },
    [
      debouncedSearch,
      filters.city,
      filters.districtId,
      filters.lookingForTeam,
      effectivePosition,
      sort,
    ],
  );

  const { items: players, loading, loadMore, hasMore, reset } =
    usePaginatedList<Player>(fetcher);
  const [resultsTotal, setResultsTotal] = useState<number | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filters.city) params.set("city", filters.city);
    if (filters.districtId) params.set("district_id", filters.districtId);
    if (filters.lookingForTeam) params.set("looking_for_team", "true");
    if (effectivePosition) params.set("position", effectivePosition);
    params.set("sort", sort);
    params.set("limit", "1");
    fetch(`/api/players?${params}`)
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
    filters.lookingForTeam,
    effectivePosition,
    sort,
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
    (filters.city ? 1 : 0) +
    (filters.districtId ? 1 : 0) +
    (filters.lookingForTeam ? 1 : 0);

  const showSkeleton = players.length === 0 && loading;
  const showEmpty = !loading && players.length === 0;

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
          placeholder="Имя, город, позиция…"
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
    </div>
  );
}
