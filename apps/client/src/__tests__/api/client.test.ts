import { vi, describe, it, expect, beforeEach } from 'vitest';
import { api } from '@client/api/client.js';

function mockFetch(body: unknown, ok = true, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as unknown as Response);
}

describe('api.roads', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('list() returns roads array', async () => {
    mockFetch({ ok: true, data: [{ id: 'r1', name: 'A38' }] });
    const roads = await api.roads.list();
    expect(roads).toEqual([{ id: 'r1', name: 'A38' }]);
  });

  it('get() returns single road', async () => {
    mockFetch({ ok: true, data: { id: 'r1', name: 'A38' } });
    const road = await api.roads.get('r1');
    expect(road).toMatchObject({ id: 'r1' });
  });

  it('create() posts payload and returns road', async () => {
    const payload = { name: 'A41', origin: [51.55, -0.19] as [number, number], destination: [51.65, -0.31] as [number, number] };
    mockFetch({ ok: true, data: { id: 'r1', ...payload } });
    const road = await api.roads.create(payload);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/roads',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(road).toMatchObject({ name: 'A41' });
  });

  it('update() patches road', async () => {
    mockFetch({ ok: true, data: { id: 'r1', name: 'M5' } });
    const road = await api.roads.update('r1', { name: 'M5' });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/roads/r1',
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(road.name).toBe('M5');
  });

  it('delete() calls DELETE endpoint', async () => {
    mockFetch({ ok: true, data: null });
    await api.roads.delete('r1');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/roads/r1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('throws when server returns ok: false', async () => {
    mockFetch({ ok: false, error: 'Road not found' });
    await expect(api.roads.get('missing')).rejects.toThrow('Road not found');
  });
});

describe('api.incidents', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('all() fetches all incidents', async () => {
    mockFetch({ ok: true, data: [] });
    await api.incidents.all();
    expect(global.fetch).toHaveBeenCalledWith('/api/incidents', expect.anything());
  });

  it('forRoad() fetches incidents for a road', async () => {
    mockFetch({ ok: true, data: [] });
    await api.incidents.forRoad('r1');
    expect(global.fetch).toHaveBeenCalledWith('/api/incidents/r1', expect.anything());
  });
});

describe('api.geocode', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('search() encodes the query', async () => {
    mockFetch({ ok: true, data: [] });
    await api.geocode.search('A38 Bristol');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/geocode?q=A38%20Bristol',
      expect.anything(),
    );
  });
});
