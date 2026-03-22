import type { Incident, IncidentCategory, IncidentMagnitude, RouteStatus } from '@cartrack/shared';
import { config } from '@server/config.js';
import { polylineBbox, isNearRoute } from '@server/services/geo.js';

const ROUTING_BASE = 'https://api.tomtom.com/routing/1/calculateRoute';
const INCIDENTS_BASE = 'https://api.tomtom.com/traffic/services/5/incidentDetails';
const ROUTE_CORRIDOR_METERS = 150;

const MAGNITUDES: IncidentMagnitude[] = ['Unknown', 'Minor', 'Moderate', 'Major', 'Undefined'];

const CATEGORY_MAP: Record<number, IncidentCategory> = {
  0: 'Unknown', 1: 'Accident', 2: 'Fog', 3: 'DangerousConditions',
  4: 'Rain', 5: 'Ice', 6: 'Jam', 7: 'LaneClosed', 8: 'RoadClosed',
  9: 'RoadWorks', 10: 'Wind', 11: 'Flooding', 14: 'Other',
};

interface TomTomRouteSummary {
  travelTimeInSeconds: number;
  trafficDelayInSeconds: number;
  noTrafficTravelTimeInSeconds: number;
}

interface TomTomRouteResponse {
  routes: Array<{
    summary: TomTomRouteSummary;
    legs: Array<{ points: Array<{ latitude: number; longitude: number }> }>;
  }>;
}

interface TomTomIncidentProperties {
  id: string; iconCategory: number; magnitudeOfDelay: number;
  events?: Array<{ description: string }>;
  from?: string; to?: string; delay?: number; length?: number;
  startTime?: string; endTime?: string;
}

interface TomTomIncidentFeature {
  properties: TomTomIncidentProperties;
  geometry?: { type: string; coordinates: unknown };
}

async function fetchRouteSummary(
  origin: [number, number],
  destination: [number, number],
): Promise<{ summary: TomTomRouteSummary; polyline: [number, number][] }> {
  const [oLat, oLon] = origin;
  const [dLat, dLon] = destination;
  const url = new URL(`${ROUTING_BASE}/${oLat},${oLon}:${dLat},${dLon}/json`);
  url.searchParams.set('key', config.tomtomApiKey);
  url.searchParams.set('traffic', 'true');
  url.searchParams.set('computeTravelTimeFor', 'all');
  url.searchParams.set('routeType', 'fastest');
  url.searchParams.set('travelMode', 'car');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TomTom routing error ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as TomTomRouteResponse;
  const route = json.routes[0];
  if (!route) throw new Error('TomTom routing returned no routes');

  const polyline: [number, number][] = route.legs[0].points.map(
    (p) => [p.latitude, p.longitude],
  );
  return { summary: route.summary, polyline };
}

async function fetchIncidentsInBbox(
  roadId: string,
  bbox: [number, number, number, number],
): Promise<Incident[]> {
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const url = new URL(INCIDENTS_BASE);
  url.searchParams.set('key', config.tomtomApiKey);
  url.searchParams.set('bbox', `${minLon},${minLat},${maxLon},${maxLat}`);
  url.searchParams.set('fields', '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description},from,to,length,delay,startTime,endTime}}}');
  url.searchParams.set('language', 'en-GB');
  url.searchParams.set('categoryFilter', '0,1,2,3,4,5,6,7,8,9,10,11,14');
  url.searchParams.set('timeValidityFilter', 'present');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TomTom incidents error ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as { incidents?: TomTomIncidentFeature[] };
  return (json.incidents ?? []).map((f): Incident => {
    const p = f.properties;
    let coords: [number, number] | undefined;
    if (f.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates)) {
      const [lon, lat] = f.geometry.coordinates as number[];
      coords = [lon, lat];
    }
    return {
      id: p.id, roadId,
      category: CATEGORY_MAP[p.iconCategory] ?? 'Unknown',
      magnitude: MAGNITUDES[p.magnitudeOfDelay] ?? 'Unknown',
      description: p.events?.[0]?.description ?? `${CATEGORY_MAP[p.iconCategory] ?? 'Incident'} on road`,
      from: p.from ?? '', to: p.to ?? '',
      delay: p.delay, length: p.length,
      startTime: p.startTime, endTime: p.endTime,
      coordinates: coords, source: 'tomtom',
    };
  });
}

export async function fetchRouteStatus(
  roadId: string,
  origin: [number, number],
  destination: [number, number],
): Promise<RouteStatus> {
  if (!config.tomtomApiKey) {
    console.warn('[tomtom] No API key — returning empty route status');
    return { roadId, journeyTimeSeconds: 0, noTrafficTimeSeconds: 0, delaySeconds: 0, incidents: [], polyline: [origin, destination], updatedAt: new Date().toISOString() };
  }

  const { summary, polyline } = await fetchRouteSummary(origin, destination);
  const bbox = polylineBbox(polyline);
  const allIncidents = await fetchIncidentsInBbox(roadId, bbox);
  const incidents = allIncidents.filter(
    (i) => !i.coordinates || isNearRoute(i.coordinates, polyline, ROUTE_CORRIDOR_METERS),
  );

  return {
    roadId,
    journeyTimeSeconds: summary.travelTimeInSeconds,
    noTrafficTimeSeconds: summary.noTrafficTravelTimeInSeconds,
    delaySeconds: summary.trafficDelayInSeconds,
    incidents,
    polyline,
    updatedAt: new Date().toISOString(),
  };
}
