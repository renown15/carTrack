import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Road, RouteStatus } from '@cartrack/shared';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  Polyline: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="route-polyline">{children}</div>
  ),
  Marker: () => <div data-testid="route-marker" />,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useMap: () => ({ fitBounds: vi.fn() }),
}));

vi.mock('leaflet', () => ({
  default: {
    latLng: vi.fn((_lat, _lon) => ({ lat: _lat, lon: _lon })),
    latLngBounds: vi.fn(() => ({ isValid: () => true })),
  },
}));

vi.mock('leaflet/dist/leaflet.css', () => ({}));

const { RoadMap } = await import('@client/components/RoadMap.js');

const ROAD: Road = {
  id: 'r1',
  name: 'A41: West Hampstead → Elstree',
  origin: [51.55, -0.19],
  destination: [51.65, -0.31],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const makeStatus = (overrides: Partial<RouteStatus> = {}): RouteStatus => ({
  roadId: 'r1',
  journeyTimeSeconds: 1200,
  noTrafficTimeSeconds: 900,
  delaySeconds: 0,
  incidents: [],
  polyline: [[51.55, -0.19], [51.60, -0.25], [51.65, -0.31]],
  updatedAt: '2026-01-01T08:00:00.000Z',
  ...overrides,
});

describe('RoadMap', () => {
  it('renders the map container', () => {
    render(<RoadMap roads={[]} routeStatusByRoad={() => undefined} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders a polyline for each road', () => {
    render(<RoadMap roads={[ROAD, { ...ROAD, id: 'r2', name: 'M5' }]} routeStatusByRoad={() => makeStatus()} />);
    expect(screen.getAllByTestId('route-polyline')).toHaveLength(2);
  });

  it('renders origin and destination markers for each road', () => {
    render(<RoadMap roads={[ROAD]} routeStatusByRoad={() => makeStatus()} />);
    expect(screen.getAllByTestId('route-marker')).toHaveLength(2);
  });

  it('shows road name in popup', () => {
    render(<RoadMap roads={[ROAD]} routeStatusByRoad={() => makeStatus()} />);
    expect(screen.getByText('A41: West Hampstead → Elstree')).toBeInTheDocument();
  });

  it('shows Clear status when no delay', () => {
    render(<RoadMap roads={[ROAD]} routeStatusByRoad={() => makeStatus({ delaySeconds: 0 })} />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('shows delay in popup when delay > 0', () => {
    render(<RoadMap roads={[ROAD]} routeStatusByRoad={() => makeStatus({ journeyTimeSeconds: 1200, delaySeconds: 300 })} />);
    expect(screen.getByText('20 min (+5 min)')).toBeInTheDocument();
  });

  it('shows Loading when no status yet', () => {
    render(<RoadMap roads={[ROAD]} routeStatusByRoad={() => undefined} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});
