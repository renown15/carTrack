// ── Road / Route config (stored in DB) ───────────────────────────────────────

export interface Road {
  id: string;
  name: string;           // e.g. "A38 Bristol Road"
  description?: string;   // e.g. "School run - morning"
  /** Bounding box for incident queries: [minLon, minLat, maxLon, maxLat] */
  bbox: [number, number, number, number];
  createdAt: string;      // ISO timestamp
}

export type CreateRoadPayload = Omit<Road, 'id' | 'createdAt'>;
export type UpdateRoadPayload = Partial<CreateRoadPayload>;

// ── Traffic incidents (from TomTom) ──────────────────────────────────────────

export type IncidentCategory =
  | 'Unknown'
  | 'Accident'
  | 'Fog'
  | 'DangerousConditions'
  | 'Rain'
  | 'Ice'
  | 'Jam'
  | 'LaneClosed'
  | 'RoadClosed'
  | 'RoadWorks'
  | 'Wind'
  | 'Flooding'
  | 'Other';

export type IncidentMagnitude = 'Unknown' | 'Minor' | 'Moderate' | 'Major' | 'Undefined';

export interface Incident {
  id: string;
  roadId: string;
  category: IncidentCategory;
  magnitude: IncidentMagnitude;
  description: string;
  from: string;
  to: string;
  delay?: number;         // seconds of delay caused
  length?: number;        // metres
  startTime?: string;     // ISO
  endTime?: string;       // ISO
  coordinates?: [number, number]; // [lon, lat]
  source: 'tomtom';
}

// ── Geocoding ─────────────────────────────────────────────────────────────────

export interface GeocodeSuggestion {
  displayName: string;
  lat: number;
  lon: number;
  /** Suggested bbox for a road segment */
  bbox?: [number, number, number, number];
}

// ── API response wrappers ─────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
