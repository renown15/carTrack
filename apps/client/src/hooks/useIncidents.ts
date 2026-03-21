import { useState, useEffect, useCallback, useRef } from 'react';
import type { Incident } from '@cartrack/shared';
import { api } from '@client/api/client.js';

const POLL_INTERVAL_MS = 3 * 60 * 1000; // refresh every 3 minutes

export function useIncidents(roadIds: string[]) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetch = useCallback(async () => {
    if (roadIds.length === 0) {
      setIncidents([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await api.incidents.all();
      setIncidents(data);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  // roadIds is an array — join gives a stable primitive for the dependency
  }, [roadIds.join(',')]);

  useEffect(() => {
    void fetch();
    timerRef.current = setInterval(() => { void fetch(); }, POLL_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetch]);

  const incidentsByRoad = (roadId: string) =>
    incidents.filter((i) => i.roadId === roadId);

  return { incidents, incidentsByRoad, loading, lastUpdated, error, refresh: fetch };
}
