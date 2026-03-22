/**
 * Geometry helpers for route proximity calculations.
 * All polylines use [lat, lon] pairs; TomTom incident coordinates are [lon, lat].
 */

/** Bounding box [minLon, minLat, maxLon, maxLat] of a [lat,lon] polyline. */
export function polylineBbox(
  polyline: [number, number][],
): [number, number, number, number] {
  const lats = polyline.map((p) => p[0]);
  const lons = polyline.map((p) => p[1]);
  return [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)];
}

/**
 * Approximate distance in metres from a [lat,lon] point to a [lat,lon] segment.
 * Uses an equirectangular projection — accurate enough within ~50 km at UK latitudes.
 */
function distToSegment(
  point: [number, number],
  a: [number, number],
  b: [number, number],
): number {
  const R = 111_320;
  const cosLat = Math.cos((point[0] * Math.PI) / 180);
  const px = point[1] * R * cosLat, py = point[0] * R;
  const ax = a[1] * R * cosLat,    ay = a[0] * R;
  const bx = b[1] * R * cosLat,    by = b[0] * R;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

/**
 * Returns true if a TomTom incident coordinate [lon, lat] falls within
 * `thresholdMeters` of any segment in the route polyline ([lat,lon] pairs).
 */
export function isNearRoute(
  coords: [number, number],
  polyline: [number, number][],
  thresholdMeters: number,
): boolean {
  const point: [number, number] = [coords[1], coords[0]]; // [lon,lat] → [lat,lon]
  for (let i = 0; i < polyline.length - 1; i++) {
    if (distToSegment(point, polyline[i], polyline[i + 1]) <= thresholdMeters) return true;
  }
  return false;
}
