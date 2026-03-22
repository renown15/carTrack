import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { GeocodeSuggestion } from '@cartrack/shared';

const mockApi = { geocode: { search: vi.fn() } };
vi.mock('@client/api/client.js', () => ({ api: mockApi }));

const { useLocationSearch } = await import('@client/hooks/useLocationSearch.js');

const SUGGESTION: GeocodeSuggestion = {
  displayName: 'West Hampstead, London, UK',
  lat: 51.55,
  lon: -0.19,
  bbox: [-0.2, 51.54, -0.18, 51.56],
};

describe('useLocationSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with empty state', () => {
    const { result } = renderHook(() => useLocationSearch());
    expect(result.current.query).toBe('');
    expect(result.current.selected).toBeNull();
    expect(result.current.suggestions).toEqual([]);
    expect(result.current.searching).toBe(false);
  });

  it('does not search when query is shorter than 2 chars', async () => {
    const { result } = renderHook(() => useLocationSearch());
    act(() => { result.current.onChange('A'); });
    vi.runAllTimers();
    expect(mockApi.geocode.search).not.toHaveBeenCalled();
  });

  it('searches after debounce with 2+ chars', async () => {
    mockApi.geocode.search.mockResolvedValue([SUGGESTION]);
    const { result } = renderHook(() => useLocationSearch());
    act(() => { result.current.onChange('We'); });
    await act(async () => { vi.runAllTimers(); });
    expect(mockApi.geocode.search).toHaveBeenCalledWith('We');
  });

  it('populates suggestions after search', async () => {
    mockApi.geocode.search.mockResolvedValue([SUGGESTION]);
    const { result } = renderHook(() => useLocationSearch());
    act(() => { result.current.onChange('West'); });
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(result.current.suggestions).toEqual([SUGGESTION]);
  });

  it('select sets selected and trims displayName to first segment', async () => {
    mockApi.geocode.search.mockResolvedValue([SUGGESTION]);
    const { result } = renderHook(() => useLocationSearch());
    act(() => { result.current.onChange('West'); });
    await act(async () => { await vi.runAllTimersAsync(); });
    act(() => { result.current.select(SUGGESTION); });
    expect(result.current.selected).toEqual(SUGGESTION);
    expect(result.current.query).toBe('West Hampstead');
    expect(result.current.suggestions).toEqual([]);
  });

  it('clear resets all state', async () => {
    mockApi.geocode.search.mockResolvedValue([SUGGESTION]);
    const { result } = renderHook(() => useLocationSearch());
    act(() => { result.current.onChange('West'); });
    await act(async () => { await vi.runAllTimersAsync(); });
    act(() => { result.current.select(SUGGESTION); });
    act(() => { result.current.clear(); });
    expect(result.current.query).toBe('');
    expect(result.current.selected).toBeNull();
    expect(result.current.suggestions).toEqual([]);
  });
});
