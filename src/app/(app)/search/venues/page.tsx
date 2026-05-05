"use client";

import { useCallback, useEffect, useState } from "react";
import { usePaginatedList } from "@/lib/usePaginatedList";
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
import {
  VenueListRow,
  type VenueType,
} from "@/components/venues/VenueListRow";
import {
  VenueFiltersSheet,
  type VenueFilters,
} from "@/components/venues/VenueFiltersSheet";
import { useCity, KZ_CITIES } from "@/lib/city-context";

type Venue = {
  id: string;
  name: string;
  address: string;
  city: string;
  district_id: string | null;
  district: { id: string; name: string } | null;
  photo_url: string | null;
  default_cost: number | null;
  type: VenueType | null;
  format: string | null;
  rating: number | null;
};

type VenueSort = "rating_desc" | "price_asc" | "name_asc";

const EMPTY_FILTERS: VenueFilters = { city: "", districtId: "", type: "" };

const SORT_OPTIONS = [
  { value: "rating_desc", label: "По рейтингу" },
  { value: "price_asc", label: "По цене" },
  { value: "name_asc", label: "По названию (А-Я)" },
];

export default function SearchVenuesPage() {
  const { activeCity } = useCity();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<VenueFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<VenueSort>("price_asc");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  useEffect(() => {
    setFilters((f) => (f.city ? f : { ...f, city: activeCity }));
  }, [activeCity]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const fetcher = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      if (debouncedSearch) {
        params.set("q", debouncedSearch);
      } else {
        if (filters.city) params.set("city", filters.city);
        if (filters.districtId) params.set("district_id", filters.districtId);
      }
      if (filters.type) params.set("type", filters.type);
      params.set("sort", sort);
      params.set("offset", String(offset));
      return fetch(`/api/venues?${params}`)
        .then((r) => r.json())
        .then((d) => ({
          items: (d.venues ?? []) as Venue[],
          nextOffset: d.nextOffset as number | null,
          total: d.total as number | null,
        }));
    },
    [debouncedSearch, filters.city, filters.districtId, filters.type, sort],
  );

  const { items: venues, loading, loadMore, hasMore, reset } =
    usePaginatedList<Venue>(fetcher);
  const [resultsTotal, setResultsTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (debouncedSearch) {
      params.set("q", debouncedSearch);
    } else {
      if (filters.city) params.set("city", filters.city);
      if (filters.districtId) params.set("district_id", filters.districtId);
    }
    if (filters.type) params.set("type", filters.type);
    params.set("limit", "1");
    fetch(`/api/venues?${params}`)
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
  }, [debouncedSearch, filters.city, filters.districtId, filters.type, sort]);

  const sheetActiveCount =
    (filters.districtId ? 1 : 0) + (filters.type ? 1 : 0);

  const showSkeleton = venues.length === 0 && loading;
  const showEmpty = !loading && venues.length === 0;
  const countLabel = resultsTotal != null ? `Результаты · ${resultsTotal}` : null;

  const cityForPicker = filters.city || activeCity;

  return (
    <div className="flex flex-1 flex-col" style={{ background: "var(--card)" }}>
      <PageHeader
        title="Площадки"
        actions={
          <HeaderIconButton ariaLabel="Уведомления">
            <BellIcon />
          </HeaderIconButton>
        }
      />

      <SearchSubnav />

      <div className="px-4 pt-3.5 pb-1">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          onFilterClick={() => setSheetOpen(true)}
          filterActiveCount={sheetActiveCount}
          placeholder="Название, адрес…"
          cityPicker={{
            value: cityForPicker,
            onClick: () => setCityOpen(true),
          }}
        />
      </div>

      <div className="px-4 pt-2 pb-2">
        <ListMeta
          countLabel={countLabel}
          sort={{
            value: sort,
            options: SORT_OPTIONS,
            onChange: (v) => setSort(v as VenueSort),
          }}
        />
      </div>

      <div className="flex-1">
        {showSkeleton ? (
          <div className="px-4 py-3">
            <SkeletonList count={5} />
          </div>
        ) : showEmpty ? (
          <div className="py-10 px-4">
            <EmptyState
              text="Площадок по фильтрам не нашли"
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
              {venues.map((v) => (
                <li key={v.id}>
                  <VenueListRow
                    id={v.id}
                    name={v.name}
                    address={v.address}
                    city={v.city}
                    district={v.district?.name ?? null}
                    photoUrl={v.photo_url}
                    priceFrom={v.default_cost}
                    type={v.type}
                    format={v.format}
                    rating={v.rating}
                  />
                </li>
              ))}
            </ul>
            {hasMore && <InfiniteScrollSentinel onVisible={loadMore} />}
          </>
        )}
      </div>

      <VenueFiltersSheet
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
