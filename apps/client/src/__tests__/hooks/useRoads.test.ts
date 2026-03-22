import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockApi = {
  roads: {
    list: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
};
vi.mock('@client/api/client.js', () => ({ api: mockApi }));

const { useRoads } = await import('@client/hooks/useRoads.js');

const ROAD = {
  id: 'r1',
  name: 'A41: West Hampstead → Elstree',
  origin: [51.55, -0.19] as [number, number],
  destination: [51.65, -0.31] as [number, number],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useRoads', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads roads on mount', async () => {
    mockApi.roads.list.mockResolvedValue([ROAD]);
    const { result } = renderHook(() => useRoads());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.roads).toEqual([ROAD]);
    expect(result.current.error).toBeNull();
  });

  it('sets error when load fails', async () => {
    mockApi.roads.list.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useRoads());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
    expect(result.current.roads).toEqual([]);
  });

  it('addRoad appends a road to the list', async () => {
    mockApi.roads.list.mockResolvedValue([]);
    mockApi.roads.create.mockResolvedValue(ROAD);
    const { result } = renderHook(() => useRoads());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.addRoad({ name: 'A41', origin: ROAD.origin, destination: ROAD.destination });
    });
    expect(result.current.roads).toEqual([ROAD]);
  });

  it('removeRoad deletes a road from the list', async () => {
    mockApi.roads.list.mockResolvedValue([ROAD]);
    mockApi.roads.delete.mockResolvedValue(null);
    const { result } = renderHook(() => useRoads());
    await waitFor(() => expect(result.current.roads).toHaveLength(1));
    await act(async () => {
      await result.current.removeRoad('r1');
    });
    expect(result.current.roads).toEqual([]);
  });

  it('reload re-fetches roads', async () => {
    mockApi.roads.list.mockResolvedValue([ROAD]);
    const { result } = renderHook(() => useRoads());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mockApi.roads.list.mockResolvedValue([ROAD, { ...ROAD, id: 'r2' }]);
    await act(async () => { await result.current.reload(); });
    expect(result.current.roads).toHaveLength(2);
  });
});
