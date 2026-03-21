import type { GeocodeSuggestion } from '@cartrack/shared';

const BASE = 'https://nominatim.openstreetmap.org';
const HEADERS = { 'User-Agent': 'CarTrack/1.0 (school-run road monitor)' };

export async function geocodeSearch(query: string): Promise<GeocodeSuggestion[]> {
  const url = new URL(`${BASE}/search`);
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '8');
  url.searchParams.set('addressdetails', '0');
  url.searchParams.set('extratags', '0');

  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);

  const json = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
    boundingbox?: [string, string, string, string];
  }>;

  return json.map((item) => {
    let bbox: [number, number, number, number] | undefined;
    if (item.boundingbox) {
      // Nominatim returns [minLat, maxLat, minLon, maxLon] — reorder to [minLon, minLat, maxLon, maxLat]
      const [minLat, maxLat, minLon, maxLon] = item.boundingbox.map(Number);
      bbox = [minLon, minLat, maxLon, maxLat];
    }
    return {
      displayName: item.display_name,
      lat: Number(item.lat),
      lon: Number(item.lon),
      bbox,
    };
  });
}
