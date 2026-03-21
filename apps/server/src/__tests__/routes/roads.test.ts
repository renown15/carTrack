import { vi, describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import type { Road } from '@cartrack/shared';

const mockRoadsDb = {
  list: vi.fn<() => Road[]>(),
  get: vi.fn<(id: string) => Road | undefined>(),
  insert: vi.fn<(road: Road) => void>(),
  update: vi.fn<(id: string, patch: Partial<Road>) => Road | undefined>(),
  delete: vi.fn<(id: string) => boolean>(),
};

vi.mock('@server/db.js', () => ({ roadsDb: mockRoadsDb }));

const { roadsRoutes } = await import('@server/routes/roads.js');

const ROAD: Road = {
  id: 'r1',
  name: 'A38',
  bbox: [-2.6, 51.4, -2.5, 51.5],
  createdAt: '2026-01-01T00:00:00.000Z',
};

function buildApp() {
  const app = Fastify({ logger: false });
  app.register(roadsRoutes, { prefix: '/api/roads' });
  return app;
}

describe('GET /api/roads', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns list of roads', async () => {
    mockRoadsDb.list.mockReturnValue([ROAD]);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/roads' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, data: [ROAD] });
  });

  it('returns empty list when no roads', async () => {
    mockRoadsDb.list.mockReturnValue([]);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/roads' });
    expect(res.json().data).toEqual([]);
  });
});

describe('GET /api/roads/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns road when found', async () => {
    mockRoadsDb.get.mockReturnValue(ROAD);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/roads/r1' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toMatchObject({ id: 'r1' });
  });

  it('returns 404 when not found', async () => {
    mockRoadsDb.get.mockReturnValue(undefined);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/roads/missing' });
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/roads', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a road and returns 201', async () => {
    mockRoadsDb.insert.mockReturnValue(undefined);
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/roads',
      payload: { name: 'A38', bbox: [-2.6, 51.4, -2.5, 51.5] },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().data.name).toBe('A38');
  });

  it('returns 400 when name is missing', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/roads',
      payload: { bbox: [-2.6, 51.4, -2.5, 51.5] },
    });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when bbox is missing', async () => {
    const app = buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/roads',
      payload: { name: 'A38' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('PATCH /api/roads/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns updated road', async () => {
    mockRoadsDb.get.mockReturnValue(ROAD);
    mockRoadsDb.update.mockReturnValue({ ...ROAD, name: 'M5' });
    const app = buildApp();
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/roads/r1',
      payload: { name: 'M5' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.name).toBe('M5');
  });

  it('returns 404 when road not found', async () => {
    mockRoadsDb.get.mockReturnValue(undefined);
    const app = buildApp();
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/roads/missing',
      payload: { name: 'X' },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/roads/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes road and returns ok', async () => {
    mockRoadsDb.delete.mockReturnValue(true);
    const app = buildApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/roads/r1' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ ok: true, data: null });
  });

  it('returns 404 when road not found', async () => {
    mockRoadsDb.delete.mockReturnValue(false);
    const app = buildApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/roads/missing' });
    expect(res.statusCode).toBe(404);
  });
});
