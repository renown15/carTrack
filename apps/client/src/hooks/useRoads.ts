import { useState, useEffect, useCallback } from 'react';
import type { Road, CreateRoadPayload } from '@cartrack/shared';
import { api } from '@client/api/client.js';

export function useRoads() {
  const [roads, setRoads] = useState<Road[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRoads(await api.roads.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load roads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const addRoad = async (payload: CreateRoadPayload) => {
    const road = await api.roads.create(payload);
    setRoads((prev) => [...prev, road]);
    return road;
  };

  const removeRoad = async (id: string) => {
    await api.roads.delete(id);
    setRoads((prev) => prev.filter((r) => r.id !== id));
  };

  return { roads, loading, error, reload: load, addRoad, removeRoad };
}
