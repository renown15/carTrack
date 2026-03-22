import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@server/config.js', () => ({
  config: { port: 3001, tomtomApiKey: 'test-key', dbPath: ':memory:' },
}));

const { fetchRouteStatus } = await import('@server/services/tomtom.js');

const ORIGIN: [number, number] = [51.55, -0.19];
const DEST: [number, number] = [51.65, -0.31];

const ROUTE_RESPONSE = {
  routes: [{
    summary: {
      travelTimeInSeconds: 1200,
      trafficDelayInSeconds: 300,
      noTrafficTravelTimeInSeconds: 900,
    },
    legs: [{
      points: [
        { latitude: 51.55, longitude: -0.19 },
        { latitude: 51.60, longitude: -0.25 },
        { latitude: 51.65, longitude: -0.31 },
      ],
    }],
  }],
};

const INCIDENT_FEATURE = {
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-0.25, 51.60] }, // on route
  properties: {
    id: 'inc-1', iconCategory: 1, magnitudeOfDelay: 2,
    events: [{ description: 'Accident on A41' }],
    from: 'West Hampstead', to: 'Elstree',
    length: 500, delay: 180,
    startTime: '2026-01-01T08:00:00Z', endTime: '2026-01-01T09:00:00Z',
  },
};

describe('fetchRouteStatus', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('calls routing API then incidents API', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ROUTE_RESPONSE } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ incidents: [INCIDENT_FEATURE] }) } as unknown as Response);

    const status = await fetchRouteStatus('r1', ORIGIN, DEST);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(status.roadId).toBe('r1');
    expect(status.journeyTimeSeconds).toBe(1200);
    expect(status.noTrafficTimeSeconds).toBe(900);
    expect(status.delaySeconds).toBe(300);
  });

  it('returns route polyline from routing API', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ROUTE_RESPONSE } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ incidents: [] }) } as unknown as Response);

    const status = await fetchRouteStatus('r1', ORIGIN, DEST);
    expect(status.polyline).toHaveLength(3);
    expect(status.polyline[0]).toEqual([51.55, -0.19]);
  });

  it('filters incidents to those near the route', async () => {
    const offRouteFeature = {
      ...INCIDENT_FEATURE,
      geometry: { type: 'Point', coordinates: [-0.5, 51.3] }, // far from route
      properties: { ...INCIDENT_FEATURE.properties, id: 'off-route' },
    };
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ROUTE_RESPONSE } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ incidents: [INCIDENT_FEATURE, offRouteFeature] }) } as unknown as Response);

    const status = await fetchRouteStatus('r1', ORIGIN, DEST);
    expect(status.incidents).toHaveLength(1);
    expect(status.incidents[0].id).toBe('inc-1');
  });

  it('includes incidents with no coordinates (cannot be filtered out)', async () => {
    const noGeomFeature = { ...INCIDENT_FEATURE, geometry: undefined, properties: { ...INCIDENT_FEATURE.properties, id: 'no-geom' } };
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ROUTE_RESPONSE } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ incidents: [noGeomFeature] }) } as unknown as Response);

    const status = await fetchRouteStatus('r1', ORIGIN, DEST);
    expect(status.incidents).toHaveLength(1);
  });

  it('throws when routing API returns non-ok', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false, status: 429, text: async () => 'Rate limited',
    } as unknown as Response);
    await expect(fetchRouteStatus('r1', ORIGIN, DEST)).rejects.toThrow('TomTom routing error 429');
  });

});
