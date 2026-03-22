import { useEffect } from 'react';
import { MapContainer, TileLayer, Rectangle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Road, Incident } from '@cartrack/shared';
import 'leaflet/dist/leaflet.css';

const UK_CENTER: [number, number] = [54.5, -3];
const UK_ZOOM = 5;

function rectOptions(incidents: Incident[]) {
  if (incidents.some((i) => i.magnitude === 'Major' || i.category === 'RoadClosed'))
    return { color: '#f87171', fillColor: '#fef2f2', fillOpacity: 0.5, weight: 2 };
  if (incidents.some((i) => i.magnitude === 'Moderate' || i.category === 'Jam'))
    return { color: '#fb923c', fillColor: '#fff7ed', fillOpacity: 0.5, weight: 2 };
  if (incidents.length > 0)
    return { color: '#facc15', fillColor: '#fefce8', fillOpacity: 0.5, weight: 2 };
  return { color: '#4ade80', fillColor: '#f0fdf4', fillOpacity: 0.5, weight: 2 };
}

function statusLabel(incidents: Incident[]) {
  if (incidents.some((i) => i.category === 'RoadClosed')) return 'Closed';
  if (incidents.some((i) => i.magnitude === 'Major')) return 'Major incident';
  if (incidents.some((i) => i.magnitude === 'Moderate')) return 'Delays';
  if (incidents.length > 0) return 'Minor issues';
  return 'Clear';
}

function FitBounds({ roads }: { roads: Road[] }) {
  const map = useMap();
  useEffect(() => {
    if (roads.length === 0) return;
    const points = roads.flatMap((r) => [
      L.latLng(r.bbox[1], r.bbox[0]),
      L.latLng(r.bbox[3], r.bbox[2]),
    ]);
    map.fitBounds(L.latLngBounds(points), { padding: [24, 24] });
  }, [map, roads]);
  return null;
}

interface Props {
  roads: Road[];
  incidentsByRoad: (roadId: string) => Incident[];
}

export function RoadMap({ roads, incidentsByRoad }: Props) {
  return (
    <MapContainer
      center={UK_CENTER}
      zoom={UK_ZOOM}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds roads={roads} />
      {roads.map((road) => {
        const incidents = incidentsByRoad(road.id);
        const bounds: [[number, number], [number, number]] = [
          [road.bbox[1], road.bbox[0]],
          [road.bbox[3], road.bbox[2]],
        ];
        return (
          <Rectangle key={road.id} bounds={bounds} pathOptions={rectOptions(incidents)}>
            <Popup>
              <p className="font-semibold text-sm">{road.name}</p>
              <p className="text-xs text-gray-600">{statusLabel(incidents)}</p>
              {incidents.length > 0 && (
                <p className="text-xs text-gray-400">
                  {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
                </p>
              )}
            </Popup>
          </Rectangle>
        );
      })}
    </MapContainer>
  );
}
