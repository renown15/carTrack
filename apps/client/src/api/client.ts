import type {
  Road,
  CreateRoadPayload,
  UpdateRoadPayload,
  Incident,
  GeocodeSuggestion,
  ApiResponse,
} from '@cartrack/shared';

const BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export const api = {
  roads: {
    list: () => request<Road[]>('/roads'),
    get: (id: string) => request<Road>(`/roads/${id}`),
    create: (payload: CreateRoadPayload) =>
      request<Road>('/roads', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: UpdateRoadPayload) =>
      request<Road>(`/roads/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    delete: (id: string) => request<null>(`/roads/${id}`, { method: 'DELETE' }),
  },

  incidents: {
    all: () => request<Incident[]>('/incidents'),
    forRoad: (roadId: string) => request<Incident[]>(`/incidents/${roadId}`),
  },

  geocode: {
    search: (q: string) =>
      request<GeocodeSuggestion[]>(`/geocode?q=${encodeURIComponent(q)}`),
  },
};
