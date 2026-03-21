import { vi, describe, it, expect, beforeEach } from 'vitest';
import Fastify from 'fastify';
import type { GeocodeSuggestion } from '@cartrack/shared';

const mockGeocodeSearch = vi.fn<(q: string) => Promise<GeocodeSuggestion[]>>();
vi.mock('@server/services/nominatim.js', () => ({ geocodeSearch: mockGeocodeSearch }));

const { geocodeRoutes } = await import('@server/routes/geocode.js');

const SUGGESTION: GeocodeSuggestion = {
  displayName: 'A38, Bristol',
  lat: 51.45,
  lon: -2.6,
  bbox: [-2.65, 51.4, -2.55, 51.5],
};

function buildApp() {
  const app = Fastify({ logger: false });
  app.register(geocodeRoutes, { prefix: '/api/geocode' });
  return app;
}

describe('GET /api/geocode', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when q is missing', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/geocode' });
    expect(res.statusCode).toBe(400);
  });

  it('returns 400 when q is too short', async () => {
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/geocode?q=A' });
    expect(res.statusCode).toBe(400);
  });

  it('returns suggestions for a valid query', async () => {
    mockGeocodeSearch.mockResolvedValue([SUGGESTION]);
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/geocode?q=A38' });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(1);
    expect(res.json().data[0].displayName).toBe('A38, Bristol');
  });

  it('returns 502 when geocode service throws', async () => {
    mockGeocodeSearch.mockRejectedValue(new Error('Nominatim down'));
    const app = buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/geocode?q=A38' });
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe('Nominatim down');
  });
});
