import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { RouteStatus } from '@cartrack/shared';

const mockApi = { incidents: { all: vi.fn() } };
vi.mock('@client/api/client.js', () => ({ api: mockApi }));

const { useRouteStatus } = await import('@client/hooks/useRouteStatus.js');

const STATUS: RouteStatus = {
  roadId: 'r1',
  journeyTimeSeconds: 1200,
  noTrafficTimeSeconds: 900,
  delaySeconds: 300,
  incidents: [],
  polyline: [[51.55, -0.19], [51.65, -0.31]],
  updatedAt: '2026-01-01T08:00:00.000Z',
};

describe('useRouteStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches route status on mount when road ids are provided', async () => {
    mockApi.incidents.all.mockResolvedValue([STATUS]);
    const { result } = renderHook(() => useRouteStatus(['r1']));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.statuses).toEqual([STATUS]);
    expect(result.current.lastUpdated).not.toBeNull();
  });

  it('skips fetch when roadIds is empty', async () => {
    const { result } = renderHook(() => useRouteStatus([]));
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(mockApi.incidents.all).not.toHaveBeenCalled();
    expect(result.current.statuses).toEqual([]);
  });

  it('routeStatusByRoad finds status by roadId', async () => {
    const status2 = { ...STATUS, roadId: 'r2' };
    mockApi.incidents.all.mockResolvedValue([STATUS, status2]);
    const { result } = renderHook(() => useRouteStatus(['r1', 'r2']));
    await waitFor(() => expect(result.current.statuses).toHaveLength(2));
    expect(result.current.routeStatusByRoad('r1')).toEqual(STATUS);
    expect(result.current.routeStatusByRoad('r2')).toEqual(status2);
    expect(result.current.routeStatusByRoad('r3')).toBeUndefined();
  });

  it('sets error on fetch failure', async () => {
    mockApi.incidents.all.mockRejectedValue(new Error('Timeout'));
    const { result } = renderHook(() => useRouteStatus(['r1']));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Timeout');
  });

  it('refresh re-fetches statuses', async () => {
    mockApi.incidents.all.mockResolvedValue([STATUS]);
    const { result } = renderHook(() => useRouteStatus(['r1']));
    await waitFor(() => expect(result.current.statuses).toHaveLength(1));
    mockApi.incidents.all.mockResolvedValue([STATUS, { ...STATUS, roadId: 'r2' }]);
    await act(async () => { await result.current.refresh(); });
    expect(result.current.statuses).toHaveLength(2);
  });
});
