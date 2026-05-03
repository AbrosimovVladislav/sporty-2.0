"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  type FilterChip,
} from "@/components/ui";
import { SearchSubnav } from "@/components/search/SearchSubnav";
import { EventListRow } from "@/components/events/EventListRow";
import {
  EventFiltersSheet,
  type DatePreset,
  type EventFilters,
} from "@/components/events/EventFiltersSheet";
import { EVENT_TYPE_LABEL } from "@/lib/catalogs";
import { useCity } from "@/lib/city-context";

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

type EventSort = "date_asc" | "date_desc" | "price_asc";

const TYPE_PILLS = [
  { value: "", label: "Все" },
  { value: "game", label: "Игра" },
  { value: "training", label: "Трен." },
  { value: "gathering", label: "Сбор" },
  { value: "other", label: "Другое" },
];

const SORT_OPTIONS = [
  { value: "date_asc", label: "Сначала ближайшие" },
  { value: "date_desc", label: "Сначала далёкие" },
  { value: "price_asc", label: "По цене (дешевле)" },
];

const PRESET_LABEL: Record<DatePreset, string> = {
  "": "",
  today: "Сегодня",
  this_week: "На этой неделе",
  next_week: "На следующей",
  two_weeks: "На 2 недели",
};

const EMPTY_FILTERS: EventFilters = {
  city: "",
  districtId: "",
  type: "",
  datePreset: "",
  dateFrom: "",
  dateTo: "",
  priceMax: "",
  hasSpots: false,
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // Mon = 0
  const r = new Date(d);
  r.setDate(d.getDate() - day);
  return r;
}

function resolvePreset(
  preset: DatePreset,
): { from: string; to: string } | null {
  if (!preset) return null;
  const today = new Date();
  if (preset === "today") {
    const iso = toIsoDate(today);
    return { from: iso, to: iso };
  }
  if (preset === "this_week") {
    const start = startOfWeek(today);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: toIsoDate(today), to: toIsoDate(end) };
  }
  if (preset === "next_week") {
    const start = startOfWeek(today);
    start.setDate(start.getDate() + 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: toIsoDate(start), to: toIsoDate(end) };
  }
  if (preset === "two_weeks") {
    const end = new Date(today);
    end.setDate(today.getDate() + 14);
    return { from: toIsoDate(today), to: toIsoDate(end) };
  }
  return null;
}

function formatChipDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

function SearchEventsInner() {
  const auth = useAuth();
  const userId = auth.status === "authenticated" ? auth.user.id : null;
  const { activeCity } = useCity();
  const searchParams = useSearchParams();
  const venueId = searchParams.get("venue");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typePill, setTypePill] = useState("");
  const [filters, setFilters] = useState<EventFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<EventSort>("date_asc");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [myTeamIds, setMyTeamIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFilters((f) => ({ ...f, city: activeCity }));
  }, [activeCity]);

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

  const dateRange = useMemo(() => {
    const preset = resolvePreset(filters.datePreset);
    if (preset) return preset;
    return { from: filters.dateFrom, to: filters.dateTo };
  }, [filters.datePreset, filters.dateFrom, filters.dateTo]);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filters.city) params.set("city", filters.city);
    if (filters.districtId) params.set("district_id", filters.districtId);
    if (effectiveType) params.set("type", effectiveType);
    if (dateRange.from) params.set("from", dateRange.from);
    if (dateRange.to) params.set("to", dateRange.to);
    if (filters.priceMax) params.set("price_max", filters.priceMax);
    if (filters.hasSpots) params.set("has_spots", "true");
    if (venueId) params.set("venue", venueId);
    params.set("sort", sort);
    return params.toString();
  }, [
    debouncedSearch,
    filters.city,
    filters.districtId,
    effectiveType,
    dateRange.from,
    dateRange.to,
    filters.priceMax,
    filters.hasSpots,
    venueId,
    sort,
  ]);

  const eventsQuery = useInfiniteQuery({
    queryKey: ["public-events", queryParams],
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/events/public?${queryParams}&cursor=${encodeURIComponent(pageParam)}`
        : `/api/events/public?${queryParams}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error("public events fetch failed");
      return r.json() as Promise<{
        events: PublicEvent[];
        nextCursor: string | null;
      }>;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const events = eventsQuery.data?.pages.flatMap((p) => p.events) ?? [];
  const loading = eventsQuery.isPending || eventsQuery.isFetchingNextPage;
  const hasMore = eventsQuery.hasNextPage;
  const loadMore = () => {
    if (!eventsQuery.isFetchingNextPage) eventsQuery.fetchNextPage();
  };

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
    if (filters.datePreset) {
      chips.push({
        id: "date_preset",
        label: PRESET_LABEL[filters.datePreset],
        onRemove: () =>
          setFilters((f) => ({ ...f, datePreset: "" })),
      });
    } else if (filters.dateFrom || filters.dateTo) {
      const left = filters.dateFrom ? formatChipDate(filters.dateFrom) : "...";
      const right = filters.dateTo ? formatChipDate(filters.dateTo) : "...";
      chips.push({
        id: "date_range",
        label: `${left} — ${right}`,
        onRemove: () =>
          setFilters((f) => ({ ...f, dateFrom: "", dateTo: "" })),
      });
    }
    if (filters.priceMax) {
      const label =
        filters.priceMax === "0"
          ? "Бесплатно"
          : `До ${Number(filters.priceMax).toLocaleString("ru-RU")} ₸`;
      chips.push({
        id: "price",
        label,
        onRemove: () => setFilters((f) => ({ ...f, priceMax: "" })),
      });
    }
    if (filters.hasSpots) {
      chips.push({
        id: "has_spots",
        label: "Есть места",
        onRemove: () => setFilters((f) => ({ ...f, hasSpots: false })),
      });
    }
    return chips;
  }, [filters, typePill]);

  const sheetActiveCount =
    (filters.city ? 1 : 0) +
    (filters.districtId ? 1 : 0) +
    (filters.type && !typePill ? 1 : 0) +
    (filters.datePreset || filters.dateFrom || filters.dateTo ? 1 : 0) +
    (filters.priceMax ? 1 : 0) +
    (filters.hasSpots ? 1 : 0);

  const showSkeleton = events.length === 0 && eventsQuery.isPending;
  const showEmpty = !loading && events.length === 0;
  const resultsLabel =
    events.length > 0
      ? `${events.length}${hasMore ? "+" : ""}`
      : null;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="События">
        <HeaderStatGroup>
          <HeaderStat value={stats?.total ?? "—"} label="Всего" />
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

        <ListMeta
          sort={{
            value: sort,
            options: SORT_OPTIONS,
            onChange: (v) => setSort(v as EventSort),
          }}
        />

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

export default function SearchEventsPage() {
  return (
    <Suspense fallback={<div className="flex flex-1" />}>
      <SearchEventsInner />
    </Suspense>
  );
}
