// ── Road / Route config (stored in DB) ───────────────────────────────────────

export interface Road {
  id: string;
  name: string;
  /** Human-readable start place name e.g. "West Hampstead" */
  originName?: string;
  /** Human-readable end place name e.g. "Elstree" */
  destinationName?: string;
  /** Route start point [lat, lon] */
  origin: [number, number];
  /** Route end point [lat, lon] */
  destination: [number, number];
  createdAt: string;
}

export type CreateRoadPayload = Omit<Road, 'id' | 'createdAt'>;
export type UpdateRoadPayload = Partial<CreateRoadPayload>;

// ── Route status (TomTom routing + filtered incidents) ────────────────────────

export interface RouteStatus {
  roadId: string;
  journeyTimeSeconds: number;
  noTrafficTimeSeconds: number;
  delaySeconds: number;
  incidents: Incident[];
  /** Route polyline as [lat, lon] pairs returned by TomTom routing */
  polyline: [number, number][];
  updatedAt: string;
}

// ── Traffic incidents (from TomTom incidents API) ─────────────────────────────

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
