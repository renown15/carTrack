import { useState, useEffect, useCallback, useRef } from 'react';
import type { RouteStatus } from '@cartrack/shared';
import { api } from '@client/api/client.js';

const POLL_INTERVAL_MS = 3 * 60 * 1000;

export function useRouteStatus(roadIds: string[]) {
  const [statuses, setStatuses] = useState<RouteStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async () => {
    if (roadIds.length === 0) {
      setStatuses([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await api.incidents.all();
      setStatuses(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch route status');
    } finally {
      setLoading(false);
    }
  // roadIds is an array — join gives a stable primitive for the dependency
  }, [roadIds.join(',')]);

  useEffect(() => {
    void fetchAll();
    timerRef.current = setInterval(() => { void fetchAll(); }, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchAll]);

  const routeStatusByRoad = (roadId: string): RouteStatus | undefined =>
    statuses.find((s) => s.roadId === roadId);

  return { statuses, routeStatusByRoad, loading, lastUpdated, error, refresh: fetchAll };
}
