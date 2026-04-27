"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { usePaginatedList } from "@/lib/usePaginatedList";
import InfiniteScrollSentinel from "@/components/InfiniteScrollSentinel";
import { SkeletonList } from "@/components/Skeleton";
import {
  PageHeader,
  HeaderActionButton,
  HeaderStatGroup,
  HeaderStat,
  ListSearchBar,
  ListMeta,
  ActiveFilterChips,
  EmptyState,
  type FilterChip,
} from "@/components/ui";
import { TeamListRow } from "@/components/teams/TeamListRow";
import {
  TeamFiltersSheet,
  type TeamFilters,
} from "@/components/teams/TeamFiltersSheet";
import { SPORT_LABEL } from "@/lib/catalogs";

type Team = {
  id: string;
  name: string;
  sport: string;
  city: string;
  description: string | null;
  created_at: string;
  looking_for_players: boolean;
  district_id: string | null;
  district: { id: string; name: string } | null;
  members_count: number;
};

type MyTeam = Team & { role: "organizer" | "player" };

type Stats = {
  total: number;
  mine: number | null;
  lookingForPlayers: number;
};

type SortMode = "mine_first" | "newest";

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

function teamMatchesFilters(t: MyTeam, q: string, f: TeamFilters): boolean {
  if (q && !t.name.toLowerCase().includes(q.toLowerCase())) return false;
  if (f.city && !t.city.toLowerCase().includes(f.city.toLowerCase())) return false;
  if (f.districtId && t.district_id !== f.districtId) return false;
  if (f.sport && t.sport !== f.sport) return false;
  if (f.lookingForPlayers && !t.looking_for_players) return false;
  return true;
}

export default function TeamsPage() {
  const auth = useAuth();
  const router = useRouter();
  const userId = auth.status === "authenticated" ? auth.user.id : null;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("mine_first");
  const [filters, setFilters] = useState<TeamFilters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [myTeams, setMyTeams] = useState<MyTeam[] | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Stats
  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (userId) params.set("userId", userId);
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
  }, [userId, filters.city, filters.sport]);

  // My teams
  useEffect(() => {
    if (!userId) {
      setMyTeams([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/users/${userId}/teams`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setMyTeams((d.teams ?? []) as MyTeam[]);
      })
      .catch(() => {
        if (!cancelled) setMyTeams([]);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const myTeamIds = useMemo(
    () => new Set((myTeams ?? []).map((t) => t.id)),
    [myTeams],
  );

  const visibleMyTeams = useMemo(
    () =>
      (myTeams ?? []).filter((t) =>
        teamMatchesFilters(t, debouncedSearch, filters),
      ),
    [myTeams, debouncedSearch, filters],
  );

  const showGrouped = sort === "mine_first" && visibleMyTeams.length > 0;

  // Paginated list of "all" teams (excluding mine when grouped)
  const fetcher = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (filters.city) params.set("city", filters.city);
      if (filters.districtId) params.set("district_id", filters.districtId);
      if (filters.sport) params.set("sport", filters.sport);
      if (filters.lookingForPlayers) params.set("looking_for_players", "true");
      if (showGrouped && myTeamIds.size > 0) {
        params.set("exclude_ids", Array.from(myTeamIds).join(","));
      }
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
      showGrouped,
      myTeamIds,
    ],
  );

  const { items: otherTeams, loading, loadMore, hasMore, reset } =
    usePaginatedList<Team>(fetcher);

  const [othersTotal, setOthersTotal] = useState<number | null>(null);
  const [allTotal, setAllTotal] = useState<number | null>(null);

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
        if (!cancelled) setAllTotal(typeof d.total === "number" ? d.total : null);
      })
      .catch(() => {
        if (!cancelled) setAllTotal(null);
      });

    if (showGrouped && myTeamIds.size > 0) {
      const grouped = new URLSearchParams(params);
      grouped.set("exclude_ids", Array.from(myTeamIds).join(","));
      fetch(`/api/teams?${grouped}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled)
            setOthersTotal(typeof d.total === "number" ? d.total : null);
        })
        .catch(() => {
          if (!cancelled) setOthersTotal(null);
        });
    } else {
      setOthersTotal(null);
    }

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
    showGrouped,
    myTeamIds,
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

  const countLabel =
    allTotal === null
      ? "Загружаем…"
      : `Найдено ${allTotal} ${pluralTeams(allTotal)}`;

  const SORT_OPTIONS = userId
    ? [
        { value: "mine_first", label: "Сначала мои" },
        { value: "newest", label: "Сначала новые" },
      ]
    : [{ value: "newest", label: "Сначала новые" }];

  const showSkeleton =
    otherTeams.length === 0 && loading && myTeams === null;

  const hasFilters =
    debouncedSearch.length > 0 ||
    filters.city.length > 0 ||
    filters.districtId.length > 0 ||
    filters.sport.length > 0 ||
    filters.lookingForPlayers;

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="Команды"
        actions={
          userId ? (
            <HeaderActionButton
              onClick={() => router.push("/teams/create")}
              ariaLabel="Создать команду"
            >
              <PlusIcon />
              <span>Создать</span>
            </HeaderActionButton>
          ) : undefined
        }
      >
        <HeaderStatGroup>
          <HeaderStat value={stats?.total ?? "—"} label="Всего" />
          {userId && <HeaderStat value={stats?.mine ?? "—"} label="Мои" />}
          <HeaderStat
            value={stats?.lookingForPlayers ?? "—"}
            label="Ищут игроков"
          />
        </HeaderStatGroup>
      </PageHeader>

      <div className="px-4 mt-4">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          onFilterClick={() => setSheetOpen(true)}
          filterActiveCount={sheetActiveCount}
          placeholder="Имя команды, город…"
        />

        <ListMeta
          countLabel={countLabel}
          sort={
            userId
              ? {
                  value: sort,
                  options: SORT_OPTIONS,
                  onChange: (v) => setSort(v as SortMode),
                }
              : undefined
          }
        />

        {activeChips.length > 0 && (
          <ActiveFilterChips chips={activeChips} className="mt-3.5" />
        )}
      </div>

      <div className="px-4 mt-5">
        {showGrouped ? (
          <GroupedSection
            myTeams={visibleMyTeams}
            otherTeams={otherTeams}
            othersTotal={othersTotal}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
        ) : (
          <FlatSection
            teams={otherTeams}
            myTeamIds={myTeamIds}
            myRoles={Object.fromEntries(
              (myTeams ?? []).map((t) => [t.id, t.role]),
            )}
            loading={loading || showSkeleton}
            hasMore={hasMore}
            onLoadMore={loadMore}
            total={allTotal}
            onClearFilters={() => {
              setSearch("");
              setFilters(EMPTY_FILTERS);
            }}
            hasFilters={hasFilters}
          />
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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase mb-1"
      style={{
        letterSpacing: "0.06em",
        color: "var(--text-tertiary)",
      }}
    >
      {children}
    </p>
  );
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function GroupedSection({
  myTeams,
  otherTeams,
  othersTotal,
  loading,
  hasMore,
  onLoadMore,
}: {
  myTeams: MyTeam[];
  otherTeams: Team[];
  othersTotal: number | null;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}) {
  return (
    <>
      <Eyebrow>Мои · {myTeams.length}</Eyebrow>
      <ul className="flex flex-col">
        {myTeams.map((t) => (
          <li key={t.id}>
            <TeamListRow
              id={t.id}
              name={t.name}
              sport={t.sport}
              city={t.city}
              district={t.district?.name ?? null}
              membersCount={t.members_count}
              lookingForPlayers={t.looking_for_players}
              myRole={t.role}
            />
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <Eyebrow>
          Все остальные{othersTotal !== null ? ` · ${othersTotal}` : ""}
        </Eyebrow>
        {otherTeams.length === 0 && loading ? (
          <SkeletonList count={3} />
        ) : otherTeams.length === 0 ? (
          <p
            className="text-[13px] py-4"
            style={{ color: "var(--text-tertiary)" }}
          >
            Других команд по этим фильтрам не нашли
          </p>
        ) : (
          <ul className="flex flex-col">
            {otherTeams.map((t) => (
              <li key={t.id}>
                <TeamListRow
                  id={t.id}
                  name={t.name}
                  sport={t.sport}
                  city={t.city}
                  district={t.district?.name ?? null}
                  membersCount={t.members_count}
                  lookingForPlayers={t.looking_for_players}
                />
              </li>
            ))}
          </ul>
        )}
        {hasMore && <InfiniteScrollSentinel onVisible={onLoadMore} />}
      </div>
    </>
  );
}

function FlatSection({
  teams,
  myTeamIds,
  myRoles,
  loading,
  hasMore,
  onLoadMore,
  total,
  onClearFilters,
  hasFilters,
}: {
  teams: Team[];
  myTeamIds: Set<string>;
  myRoles: Record<string, "organizer" | "player">;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  total: number | null;
  onClearFilters: () => void;
  hasFilters: boolean;
}) {
  if (teams.length === 0 && loading) return <SkeletonList count={5} />;
  if (teams.length === 0) {
    return (
      <div className="py-10">
        <EmptyState
          text={
            hasFilters
              ? "По выбранным фильтрам ничего не найдено"
              : "Команд пока нет"
          }
          action={
            hasFilters
              ? { label: "Сбросить фильтры", onClick: onClearFilters }
              : undefined
          }
        />
      </div>
    );
  }
  return (
    <>
      {total !== null && total > 0 && (
        <Eyebrow>Результаты · {total}</Eyebrow>
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
            />
          </li>
        ))}
      </ul>
      {hasMore && <InfiniteScrollSentinel onVisible={onLoadMore} />}
    </>
  );
}
