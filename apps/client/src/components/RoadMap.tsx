import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Road, RouteStatus } from '@cartrack/shared';
import 'leaflet/dist/leaflet.css';

const UK_CENTER: [number, number] = [54.5, -3];
const UK_ZOOM = 5;

function polylineColor(status: RouteStatus | undefined): string {
  if (!status) return '#94a3b8';           // gray — not yet loaded
  if (status.delaySeconds > 600) return '#f87171';  // red
  if (status.delaySeconds > 180) return '#fb923c';  // orange
  if (status.delaySeconds > 0)   return '#facc15';  // yellow
  return '#22c55e';                                  // green
}

function delayLabel(status: RouteStatus | undefined): string {
  if (!status) return 'Loading…';
  if (status.delaySeconds > 600) return 'Major delays';
  if (status.delaySeconds > 180) return 'Delays';
  if (status.delaySeconds > 0)   return 'Minor delay';
  return 'Clear';
}

function fmt(s: number) {
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function FitBounds({ roads }: { roads: Road[] }) {
  const map = useMap();
  useEffect(() => {
    if (roads.length === 0) return;
    const points = roads.flatMap((r) => [
      L.latLng(r.origin[0], r.origin[1]),
      L.latLng(r.destination[0], r.destination[1]),
    ]);
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, roads]);
  return null;
}

interface Props {
  roads: Road[];
  routeStatusByRoad: (roadId: string) => RouteStatus | undefined;
}

export function RoadMap({ roads, routeStatusByRoad }: Props) {
  return (
    <MapContainer
      center={UK_CENTER}
      zoom={UK_ZOOM}
      className="h-full w-full rounded-2xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds roads={roads} />
      {roads.map((road) => {
        const status = routeStatusByRoad(road.id);
        const routeLine: [number, number][] = status?.polyline?.length
          ? status.polyline
          : [road.origin, road.destination];
        const color = polylineColor(status);

        return (
          <Polyline key={road.id} positions={routeLine} pathOptions={{ color, weight: 5, opacity: 0.85 }}>
            <Popup>
              <p className="font-semibold text-sm">{road.name}</p>
              <p className="text-xs text-gray-600">{delayLabel(status)}</p>
              {status && (
                <p className="text-xs text-gray-500">
                  {fmt(status.journeyTimeSeconds)}
                  {status.delaySeconds > 0 && ` (+${fmt(status.delaySeconds)})`}
                </p>
              )}
            </Popup>
          </Polyline>
        );
      })}
      {roads.map((road) => (
        <Marker key={`${road.id}-origin`} position={road.origin} />
      ))}
      {roads.map((road) => (
        <Marker key={`${road.id}-dest`} position={road.destination} />
      ))}
    </MapContainer>
  );
}
