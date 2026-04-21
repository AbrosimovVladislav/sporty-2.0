import { useCallback, useRef, useState } from "react";

type PageResult<T> = { items: T[]; nextOffset: number | null };
type Fetcher<T> = (offset: number) => Promise<PageResult<T>>;

export function usePaginatedList<T>(fetcher: Fetcher<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const versionRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback((offset: number, replace: boolean) => {
    const version = ++versionRef.current;
    if (replace) setItems([]);
    setLoading(true);
    fetcherRef.current(offset)
      .then((result) => {
        if (versionRef.current !== version) return;
        if (replace) setItems(result.items);
        else setItems((prev) => [...prev, ...result.items]);
        setNextOffset(result.nextOffset);
        setLoading(false);
      })
      .catch(() => {
        if (versionRef.current === version) setLoading(false);
      });
  }, []);

  const loadMore = useCallback(() => {
    if (nextOffset === null || loading) return;
    load(nextOffset, false);
  }, [nextOffset, loading, load]);

  const reset = useCallback(() => {
    load(0, true);
  }, [load]);

  return { items, loading, loadMore, hasMore: nextOffset !== null, reset };
}
