import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

const mockApi = {
  incidents: { all: vi.fn() },
};
vi.mock('@client/api/client.js', () => ({ api: mockApi }));

const { useIncidents } = await import('@client/hooks/useIncidents.js');

const INC = {
  id: 'i1',
  roadId: 'r1',
  category: 'Accident' as const,
  magnitude: 'Minor' as const,
  description: 'Minor crash',
  from: 'A',
  to: 'B',
  source: 'tomtom' as const,
};

describe('useIncidents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches incidents on mount when road ids are provided', async () => {
    mockApi.incidents.all.mockResolvedValue([INC]);
    const { result } = renderHook(() => useIncidents(['r1']));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.incidents).toEqual([INC]);
    expect(result.current.lastUpdated).not.toBeNull();
  });

  it('skips fetch when roadIds is empty', async () => {
    const { result } = renderHook(() => useIncidents([]));
    // Let effects settle without triggering a fetch
    await act(async () => { await new Promise((r) => setTimeout(r, 0)); });
    expect(mockApi.incidents.all).not.toHaveBeenCalled();
    expect(result.current.incidents).toEqual([]);
  });

  it('incidentsByRoad filters by roadId', async () => {
    const inc2 = { ...INC, id: 'i2', roadId: 'r2' };
    mockApi.incidents.all.mockResolvedValue([INC, inc2]);
    const { result } = renderHook(() => useIncidents(['r1', 'r2']));
    await waitFor(() => expect(result.current.incidents).toHaveLength(2));
    expect(result.current.incidentsByRoad('r1')).toEqual([INC]);
    expect(result.current.incidentsByRoad('r2')).toEqual([inc2]);
  });

  it('sets error on fetch failure', async () => {
    mockApi.incidents.all.mockRejectedValue(new Error('Timeout'));
    const { result } = renderHook(() => useIncidents(['r1']));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Timeout');
  });

  it('refresh re-fetches incidents', async () => {
    mockApi.incidents.all.mockResolvedValue([INC]);
    const { result } = renderHook(() => useIncidents(['r1']));
    await waitFor(() => expect(result.current.incidents).toHaveLength(1));
    mockApi.incidents.all.mockResolvedValue([INC, { ...INC, id: 'i2' }]);
    await act(async () => { await result.current.refresh(); });
    expect(result.current.incidents).toHaveLength(2);
  });
});
