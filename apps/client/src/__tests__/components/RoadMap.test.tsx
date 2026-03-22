import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Road, Incident } from '@cartrack/shared';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  TileLayer: () => null,
  Rectangle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="road-rectangle">{children}</div>
  ),
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
  name: 'A38 Bristol',
  bbox: [-2.6, 51.4, -2.5, 51.5],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const makeIncident = (overrides: Partial<Incident> = {}): Incident => ({
  id: 'i1', roadId: 'r1', category: 'Accident', magnitude: 'Minor',
  description: 'Minor accident', from: 'A', to: 'B', source: 'tomtom', ...overrides,
});

describe('RoadMap', () => {
  it('renders the map container', () => {
    render(<RoadMap roads={[]} incidentsByRoad={() => []} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders a rectangle for each road', () => {
    render(<RoadMap roads={[ROAD, { ...ROAD, id: 'r2', name: 'M5' }]} incidentsByRoad={() => []} />);
    expect(screen.getAllByTestId('road-rectangle')).toHaveLength(2);
  });

  it('shows road name in popup', () => {
    render(<RoadMap roads={[ROAD]} incidentsByRoad={() => []} />);
    expect(screen.getByText('A38 Bristol')).toBeInTheDocument();
  });

  it('shows Clear status when no incidents', () => {
    render(<RoadMap roads={[ROAD]} incidentsByRoad={() => []} />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('shows incident count when incidents exist', () => {
    render(<RoadMap roads={[ROAD]} incidentsByRoad={() => [makeIncident(), makeIncident({ id: 'i2' })]} />);
    expect(screen.getByText('2 incidents')).toBeInTheDocument();
  });

  it('shows singular incident label for one incident', () => {
    render(<RoadMap roads={[ROAD]} incidentsByRoad={() => [makeIncident()]} />);
    expect(screen.getByText('1 incident')).toBeInTheDocument();
  });

  it('shows Closed status for RoadClosed category', () => {
    render(<RoadMap roads={[ROAD]} incidentsByRoad={() => [makeIncident({ category: 'RoadClosed', magnitude: 'Major' })]} />);
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });
});
