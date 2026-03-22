import { describe, it, expect } from 'vitest';
import { polylineBbox, isNearRoute } from '@server/services/geo.js';

const POLYLINE: [number, number][] = [
  [51.55, -0.19],
  [51.60, -0.25],
  [51.65, -0.31],
];

describe('polylineBbox', () => {
  it('returns [minLon, minLat, maxLon, maxLat]', () => {
    const bbox = polylineBbox(POLYLINE);
    expect(bbox[0]).toBeCloseTo(-0.31); // minLon
    expect(bbox[1]).toBeCloseTo(51.55); // minLat
    expect(bbox[2]).toBeCloseTo(-0.19); // maxLon
    expect(bbox[3]).toBeCloseTo(51.65); // maxLat
  });

  it('handles a single point', () => {
    const bbox = polylineBbox([[51.5, -0.2]]);
    expect(bbox[0]).toBe(-0.2);
    expect(bbox[1]).toBe(51.5);
    expect(bbox[2]).toBe(-0.2);
    expect(bbox[3]).toBe(51.5);
  });
});

describe('isNearRoute', () => {
  it('returns true for a point on the route', () => {
    // Midpoint of the polyline — [lon, lat] as TomTom returns
    expect(isNearRoute([-0.25, 51.60], POLYLINE, 150)).toBe(true);
  });

  it('returns true for a point very close to a segment', () => {
    // ~50m off the route at midpoint
    expect(isNearRoute([-0.2505, 51.6003], POLYLINE, 150)).toBe(true);
  });

  it('returns false for a point far from the route', () => {
    expect(isNearRoute([-0.5, 51.3], POLYLINE, 150)).toBe(false);
  });

  it('returns true for a point near the start', () => {
    expect(isNearRoute([-0.19, 51.55], POLYLINE, 150)).toBe(true);
  });

  it('returns true for a point near the end', () => {
    expect(isNearRoute([-0.31, 51.65], POLYLINE, 150)).toBe(true);
  });
});
