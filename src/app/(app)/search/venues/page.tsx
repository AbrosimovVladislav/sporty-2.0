"use client";

import { useCallback, useEffect, useState } from "react";
import { usePaginatedList } from "@/lib/usePaginatedList";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";
import { SkeletonList } from "@/components/Skeleton";
import {
  PageHeader,
  ListSearchBar,
  ListMeta,
  EmptyState,
  CityPickerSheet,
} from "@/components/ui";
import { SearchSubnav } from "@/components/search/SearchSubnav";
import { VenueListRow } from "@/components/venues/VenueListRow";
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
};

const EMPTY_FILTERS: VenueFilters = { city: "", districtId: "" };

export default function SearchVenuesPage() {
  const { activeCity } = useCity();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<VenueFilters>(EMPTY_FILTERS);
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
      params.set("offset", String(offset));
      return fetch(`/api/venues?${params}`)
        .then((r) => r.json())
        .then((d) => ({
          items: (d.venues ?? []) as Venue[],
          nextOffset: d.nextOffset as number | null,
          total: d.total as number | null,
        }));
    },
    [debouncedSearch, filters.city, filters.districtId],
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
  }, [debouncedSearch, filters.city, filters.districtId]);

  const sheetActiveCount = filters.districtId ? 1 : 0;

  const showSkeleton = venues.length === 0 && loading;
  const showEmpty = !loading && venues.length === 0;
  const countLabel = resultsTotal != null ? `Результаты · ${resultsTotal}` : null;

  const cityForPicker = filters.city || activeCity;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Площадки" />

      <SearchSubnav />

      <div className="px-4 mt-3.5">
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

      <div className="px-4 mt-3">
        <ListMeta countLabel={countLabel} />
        {showSkeleton ? (
          <SkeletonList count={5} />
        ) : showEmpty ? (
          <div className="py-10">
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
