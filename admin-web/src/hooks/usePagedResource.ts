import { useCallback, useEffect, useState } from "react";

export function usePagedResource<T>(loader: (page: number, limit: number) => Promise<T[]>, limit = 20) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    loader(page, limit).then((result) => {
      if (active) setItems(result);
    }).catch(() => {
      if (active) { setItems([]); setError(true); }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [loader, page, limit, version]);
  return { page, items, setItems, loading, error, refresh, previous: () => setPage((value) => Math.max(1, value - 1)), next: () => setPage((value) => value + 1), hasNext: items.length === limit };
}
