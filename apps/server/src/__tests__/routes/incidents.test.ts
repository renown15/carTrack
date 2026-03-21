import { vi, describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import type { Road, Incident } from '@cartrack/shared';

const mockRoadsDb = {
  list: vi.fn<() => Road[]>(),
  get: vi.fn<(id: string) => Road | undefined>(),
};
const mockFetchIncidents = vi.fn<(id: string, bbox: [number, number, number, number]) => Promise<Incident[]>>();

vi.mock('@server/db.js', () => ({ roadsDb: mockRoadsDb }));
vi.mock('@server/services/tomtom.js', () => ({ fetchIncidents: mockFetchIncidents }));

const { incidentsRoutes } = await import('@server/routes/incidents.js');

const ROAD: Road = {
  id: 'r1',
  name: 'A38',
  bbox: [-2.6, 51.4, -2.5, 51.5],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const INC: Incident = {
  id: 'i1',
  roadId: 'r1',
  category: 'Accident',
  magnitude: 'Major',
  description: 'Multi-vehicle accident',
  from: 'Bristol',
  to: 'Exeter',
  source: 'tomtom',
};

function buildApp() {
  const app = Fastify({ logger: false });
  app.register(incidentsRoutes, { prefix: '/api/incidents' });
  return app;
}

describe('GET /api/incidents/:roadId', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns incidents for a known road', async () => {
    mockRoadsDb.get.mockReturnValue(ROAD);
    mockFetchIncidents.mockResolvedValue([INC]);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/incidents/r1' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
  });

  it('returns 404 for unknown road', async () => {
    mockRoadsDb.get.mockReturnValue(undefined);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/incidents/missing' });
    expect(res.statusCode).toBe(404);
  });

  it('returns 502 when TomTom throws', async () => {
    mockRoadsDb.get.mockReturnValue(ROAD);
    mockFetchIncidents.mockRejectedValue(new Error('API down'));
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/incidents/r1' });
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe('API down');
  });
});

describe('GET /api/incidents', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty array when no roads exist', async () => {
    mockRoadsDb.list.mockReturnValue([]);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/incidents' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toEqual([]);
  });

  it('aggregates incidents across all roads', async () => {
    mockRoadsDb.list.mockReturnValue([ROAD, { ...ROAD, id: 'r2' }]);
    mockFetchIncidents
      .mockResolvedValueOnce([INC])
      .mockResolvedValueOnce([{ ...INC, id: 'i2', roadId: 'r2' }]);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/incidents' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(2);
  });

  it('silently drops failed roads and returns the rest', async () => {
    mockRoadsDb.list.mockReturnValue([ROAD, { ...ROAD, id: 'r2' }]);
    mockFetchIncidents
      .mockResolvedValueOnce([INC])
      .mockRejectedValueOnce(new Error('fail'));
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/incidents' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
  });
});
