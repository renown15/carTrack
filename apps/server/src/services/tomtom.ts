import type { Incident, IncidentCategory, IncidentMagnitude } from '@cartrack/shared';
import { config } from '@server/config.js';

const BASE = 'https://api.tomtom.com/traffic/services/5/incidentDetails';

// TomTom magnitude: 0=Unknown 1=Minor 2=Moderate 3=Major 4=Undefined
const MAGNITUDES: IncidentMagnitude[] = ['Unknown', 'Minor', 'Moderate', 'Major', 'Undefined'];

// TomTom iconCategory to our IncidentCategory
const CATEGORY_MAP: Record<number, IncidentCategory> = {
  0: 'Unknown',
  1: 'Accident',
  2: 'Fog',
  3: 'DangerousConditions',
  4: 'Rain',
  5: 'Ice',
  6: 'Jam',
  7: 'LaneClosed',
  8: 'RoadClosed',
  9: 'RoadWorks',
  10: 'Wind',
  11: 'Flooding',
  14: 'Other',
};

interface TomTomProperties {
  id: string;
  iconCategory: number;
  magnitudeOfDelay: number;
  events?: Array<{ description: string; code: number; iconCategory: number }>;
  startTime?: string;
  endTime?: string;
  from?: string;
  to?: string;
  length?: number;
  delay?: number;
}

interface TomTomFeature {
  type: 'Feature';
  geometry?: { type: string; coordinates: unknown };
  properties: TomTomProperties;
}

export async function fetchIncidents(
  roadId: string,
  bbox: [number, number, number, number],
): Promise<Incident[]> {
  if (!config.tomtomApiKey) {
    console.warn('[tomtom] No API key configured — returning empty incidents');
    return [];
  }

  const [minLon, minLat, maxLon, maxLat] = bbox;
  const bboxParam = `${minLon},${minLat},${maxLon},${maxLat}`;

  const url = new URL(BASE);
  url.searchParams.set('key', config.tomtomApiKey);
  url.searchParams.set('bbox', bboxParam);
  url.searchParams.set('fields', '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay}}}');
  url.searchParams.set('language', 'en-GB');
  url.searchParams.set('categoryFilter', '0,1,2,3,4,5,6,7,8,9,10,11,14');
  url.searchParams.set('timeValidityFilter', 'present');

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TomTom API error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as { incidents?: TomTomFeature[] };
  const features = json.incidents ?? [];

  return features.map((f): Incident => {
    const p = f.properties;
    const category = CATEGORY_MAP[p.iconCategory] ?? 'Unknown';
    const magnitude = MAGNITUDES[p.magnitudeOfDelay] ?? 'Unknown';
    const description =
      p.events?.[0]?.description ?? `${category} on road`;

    let coords: [number, number] | undefined;
    if (f.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates)) {
      const [lon, lat] = f.geometry.coordinates as number[];
      coords = [lon, lat];
    }

    return {
      id: p.id,
      roadId,
      category,
      magnitude,
      description,
      from: p.from ?? '',
      to: p.to ?? '',
      delay: p.delay,
      length: p.length,
      startTime: p.startTime,
      endTime: p.endTime,
      coordinates: coords,
      source: 'tomtom',
    };
  });
}
