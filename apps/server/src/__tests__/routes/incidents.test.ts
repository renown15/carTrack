import { vi, describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import type { Road, RouteStatus } from '@cartrack/shared';

const mockRoadsDb = {
  list: vi.fn<() => Road[]>(),
  get: vi.fn<(id: string) => Road | undefined>(),
};
const mockFetchRouteStatus = vi.fn<
  (id: string, origin: [number, number], dest: [number, number]) => Promise<RouteStatus>
>();

vi.mock('@server/db.js', () => ({ roadsDb: mockRoadsDb }));
vi.mock('@server/services/tomtom.js', () => ({ fetchRouteStatus: mockFetchRouteStatus }));

const { incidentsRoutes } = await import('@server/routes/incidents.js');

const ROAD: Road = {
  id: 'r1',
  name: 'A41: West Hampstead → Elstree',
  origin: [51.55, -0.19],
  destination: [51.65, -0.31],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const STATUS: RouteStatus = {
  roadId: 'r1',
  journeyTimeSeconds: 1200,
  noTrafficTimeSeconds: 900,
  delaySeconds: 300,
  incidents: [],
  polyline: [[51.55, -0.19], [51.65, -0.31]],
  updatedAt: '2026-01-01T08:00:00.000Z',
};

function buildApp() {
  const app = Fastify({ logger: false });
  app.register(incidentsRoutes, { prefix: '/api/incidents' });
  return app;
}

describe('GET /api/incidents/:roadId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns route status for a known road', async () => {
    mockRoadsDb.get.mockReturnValue(ROAD);
    mockFetchRouteStatus.mockResolvedValue(STATUS);
    const res = await buildApp().inject({ method: 'GET', url: '/api/incidents/r1' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.journeyTimeSeconds).toBe(1200);
    expect(res.json().data.delaySeconds).toBe(300);
  });

  it('returns 404 for unknown road', async () => {
    mockRoadsDb.get.mockReturnValue(undefined);
    const res = await buildApp().inject({ method: 'GET', url: '/api/incidents/missing' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 502 when TomTom throws', async () => {
    mockRoadsDb.get.mockReturnValue(ROAD);
    mockFetchRouteStatus.mockRejectedValue(new Error('API down'));
    const res = await buildApp().inject({ method: 'GET', url: '/api/incidents/r1' });
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe('API down');
  });
});

describe('GET /api/incidents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when no roads exist', async () => {
    mockRoadsDb.list.mockReturnValue([]);
    const res = await buildApp().inject({ method: 'GET', url: '/api/incidents' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual([]);
  });

  it('returns route statuses for all roads', async () => {
    const road2 = { ...ROAD, id: 'r2' };
    mockRoadsDb.list.mockReturnValue([ROAD, road2]);
    mockFetchRouteStatus
      .mockResolvedValueOnce(STATUS)
      .mockResolvedValueOnce({ ...STATUS, roadId: 'r2' });
    const res = await buildApp().inject({ method: 'GET', url: '/api/incidents' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(2);
  });

  it('silently drops failed roads and returns the rest', async () => {
    mockRoadsDb.list.mockReturnValue([ROAD, { ...ROAD, id: 'r2' }]);
    mockFetchRouteStatus
      .mockResolvedValueOnce(STATUS)
      .mockRejectedValueOnce(new Error('fail'));
    const res = await buildApp().inject({ method: 'GET', url: '/api/incidents' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
  });
});
