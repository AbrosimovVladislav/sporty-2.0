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
import { EventListRow } from "@/components/events/EventListRow";
import {
  EventFiltersSheet,
  type EventFilters,
} from "@/components/events/EventFiltersSheet";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";

type PublicEvent = {
  id: string;
  team_id: string;
  type: string;
  date: string;
  price_per_player: number;
  min_players: number;
  description: string | null;
  venue: {
    id: string;
    name: string;
    city: string;
    district: { id: string; name: string } | null;
  } | null;
  team: { id: string; name: string; city: string } | null;
  yes_count: number;
};

type Stats = { total: number; today: number; week: number };

type MyTeam = { id: string };

const TYPE_PILLS = [
  { value: "", label: "Все" },
  { value: "game", label: "Игра" },
  { value: "training", label: "Трен." },
  { value: "gathering", label: "Сбор" },
  { value: "other", label: "Другое" },
];

const EMPTY_FILTERS: EventFilters = {
  city: "",
  districtId: "",
  type: "",
};

function pluralEvents(n: number): string {
  const m = n % 10;
  const tens = n % 100;
  if (tens >= 11 && tens <= 14) return "событий";
  if (m === 1) return "событие";
  if (m >= 2 && m <= 4) return "события";
  return "событий";
}

export default function SearchEventsPage() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typePill, setTypePill] = useState("");
  const [filters, setFilters] = useState<EventFilters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [myTeamIds, setMyTeamIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!userId) {
      setMyTeamIds(new Set());
      return;
    }
    let cancelled = false;
    fetch(`/api/users/${userId}/teams`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          const teams = (d.teams ?? []) as MyTeam[];
          setMyTeamIds(new Set(teams.map((t) => t.id)));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (filters.city) params.set("city", filters.city);
    fetch(`/api/events/stats?${params}`)
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
  }, [filters.city]);

  const effectiveType = typePill || filters.type;

  const fetcher = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (filters.city) params.set("city", filters.city);
      if (filters.districtId) params.set("district_id", filters.districtId);
      if (effectiveType) params.set("type", effectiveType);
      params.set("offset", String(offset));
      return fetch(`/api/events/public?${params}`)
        .then((r) => r.json())
        .then((d) => ({
          items: (d.events ?? []) as PublicEvent[],
          nextOffset: d.nextOffset as number | null,
          total: d.total as number | null,
        }));
    },
    [debouncedSearch, filters.city, filters.districtId, effectiveType],
  );

  const { items: events, loading, loadMore, hasMore, reset } =
    usePaginatedList<PublicEvent>(fetcher);
  const [resultsTotal, setResultsTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filters.city) params.set("city", filters.city);
    if (filters.districtId) params.set("district_id", filters.districtId);
    if (effectiveType) params.set("type", effectiveType);
    params.set("limit", "1");
    fetch(`/api/events/public?${params}`)
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
  }, [debouncedSearch, filters.city, filters.districtId, effectiveType]);

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
    if (filters.type && !typePill) {
      chips.push({
        id: "type",
        label: EVENT_TYPE_LABEL[filters.type] ?? filters.type,
        onRemove: () => setFilters((f) => ({ ...f, type: "" })),
      });
    }
    return chips;
  }, [filters, typePill]);

  const sheetActiveCount =
    (filters.city ? 1 : 0) +
    (filters.districtId ? 1 : 0) +
    (filters.type && !typePill ? 1 : 0);

  const showSkeleton = events.length === 0 && loading;
  const showEmpty = !loading && events.length === 0;

  const countLabel =
    resultsTotal === null
      ? "Загружаем…"
      : `Найдено ${resultsTotal} ${pluralEvents(resultsTotal)}`;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="События">
        <HeaderStatGroup>
          <HeaderStat value={stats?.total ?? "—"} label="Всего" />
          <HeaderStat value={stats?.today ?? "—"} label="Сегодня" />
          <HeaderStat value={stats?.week ?? "—"} label="На неделе" />
        </HeaderStatGroup>
      </PageHeader>

      <SearchSubnav />

      <div className="px-4 mt-3.5">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          onFilterClick={() => setSheetOpen(true)}
          filterActiveCount={sheetActiveCount}
          placeholder="Команда, площадка…"
        />

        <ListMeta countLabel={countLabel} />

        <FilterPills
          options={TYPE_PILLS}
          value={typePill}
          onChange={setTypePill}
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
              text="По выбранным фильтрам событий нет"
              action={{
                label: "Сбросить фильтры",
                onClick: () => {
                  setSearch("");
                  setTypePill("");
                  setFilters(EMPTY_FILTERS);
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
              {events.map((e) => (
                <li key={e.id}>
                  <EventListRow
                    id={e.id}
                    teamId={e.team_id}
                    teamName={e.team?.name ?? null}
                    type={e.type}
                    date={e.date}
                    venueName={e.venue?.name ?? null}
                    venueDistrict={e.venue?.district?.name ?? null}
                    venueCity={e.venue?.city ?? null}
                    yesCount={e.yes_count}
                    pricePerPlayer={e.price_per_player}
                    myTeam={myTeamIds.has(e.team_id)}
                  />
                </li>
              ))}
            </ul>
            {hasMore && <InfiniteScrollSentinel onVisible={loadMore} />}
          </>
        )}
      </div>

      <EventFiltersSheet
        open={sheetOpen}
        initial={filters}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => setFilters(next)}
      />
    </div>
  );
}
