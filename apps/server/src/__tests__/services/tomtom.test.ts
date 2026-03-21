import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@server/config.js', () => ({
  config: { port: 3001, tomtomApiKey: 'test-key', dbPath: ':memory:' },
}));

const { fetchIncidents } = await import('@server/services/tomtom.js');

const BBOX: [number, number, number, number] = [-2.6, 51.4, -2.5, 51.5];

const FEATURE = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-2.55, 51.45] },
  properties: {
    id: 'inc-1',
    iconCategory: 1,       // Accident
    magnitudeOfDelay: 3,   // Major
    events: [{ description: 'Multi-vehicle crash', code: 1, iconCategory: 1 }],
    startTime: '2026-01-01T08:00:00Z',
    endTime: '2026-01-01T10:00:00Z',
    from: 'Bristol',
    to: 'Exeter',
    length: 500,
    delay: 600,
  },
};

describe('fetchIncidents', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('parses a successful TomTom response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ incidents: [FEATURE] }),
    } as unknown as Response);

    const results = await fetchIncidents('road-1', BBOX);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: 'inc-1',
      roadId: 'road-1',
      category: 'Accident',
      magnitude: 'Major',
      description: 'Multi-vehicle crash',
      from: 'Bristol',
      to: 'Exeter',
      delay: 600,
      length: 500,
      coordinates: [-2.55, 51.45],
      source: 'tomtom',
    });
  });

  it('handles missing events by using category as description', async () => {
    const featureNoEvents = {
      ...FEATURE,
      properties: { ...FEATURE.properties, events: undefined },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ incidents: [featureNoEvents] }),
    } as unknown as Response);

    const results = await fetchIncidents('road-1', BBOX);
    expect(results[0].description).toBe('Accident on road');
  });

  it('handles no geometry gracefully', async () => {
    const featureNoGeom = { ...FEATURE, geometry: undefined };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ incidents: [featureNoGeom] }),
    } as unknown as Response);

    const results = await fetchIncidents('road-1', BBOX);
    expect(results[0].coordinates).toBeUndefined();
  });

  it('handles empty incidents array', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ incidents: [] }),
    } as unknown as Response);
    const results = await fetchIncidents('road-1', BBOX);
    expect(results).toEqual([]);
  });

  it('handles missing incidents key in response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as unknown as Response);
    const results = await fetchIncidents('road-1', BBOX);
    expect(results).toEqual([]);
  });

  it('throws on non-ok HTTP response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'Rate limited',
    } as unknown as Response);

    await expect(fetchIncidents('road-1', BBOX)).rejects.toThrow('TomTom API error 429');
  });

  it('maps unknown iconCategory to Unknown', async () => {
    const f = {
      ...FEATURE,
      properties: { ...FEATURE.properties, iconCategory: 999, magnitudeOfDelay: 99 },
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ incidents: [f] }),
    } as unknown as Response);
    const results = await fetchIncidents('road-1', BBOX);
    expect(results[0].category).toBe('Unknown');
    expect(results[0].magnitude).toBe('Unknown');
  });
});
