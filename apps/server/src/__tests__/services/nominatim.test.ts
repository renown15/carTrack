import { vi, describe, it, expect, beforeEach } from 'vitest';
import { geocodeSearch } from '@server/services/nominatim.js';

describe('geocodeSearch', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns parsed suggestions with bbox', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          display_name: 'A38, Bristol, England',
          lat: '51.45',
          lon: '-2.6',
          boundingbox: ['51.4', '51.5', '-2.65', '-2.55'],
        },
      ],
    } as unknown as Response);

    const results = await geocodeSearch('A38 Bristol');
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      displayName: 'A38, Bristol, England',
      lat: 51.45,
      lon: -2.6,
      bbox: [-2.65, 51.4, -2.55, 51.5],
    });
  });

  it('returns suggestions without bbox when boundingbox is absent', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { display_name: 'M5, UK', lat: '51.0', lon: '-2.0' },
      ],
    } as unknown as Response);

    const results = await geocodeSearch('M5');
    expect(results[0].bbox).toBeUndefined();
  });

  it('returns empty array when no results', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    } as unknown as Response);
    expect(await geocodeSearch('xyzxyz')).toEqual([]);
  });

  it('throws on non-ok HTTP response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as unknown as Response);
    await expect(geocodeSearch('A38')).rejects.toThrow('Nominatim error 503');
  });
});
