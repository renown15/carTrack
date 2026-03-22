import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoadCard } from '@client/components/RoadCard.js';
import type { Road, RouteStatus, Incident } from '@cartrack/shared';

const ROAD: Road = {
  id: 'r1',
  name: 'A41: West Hampstead → Elstree',
  origin: [51.55, -0.19],
  destination: [51.65, -0.31],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const noop = () => {};

const makeStatus = (overrides: Partial<RouteStatus> = {}): RouteStatus => ({
  roadId: 'r1',
  journeyTimeSeconds: 1200,
  noTrafficTimeSeconds: 900,
  delaySeconds: 0,
  incidents: [],
  polyline: [[51.55, -0.19], [51.65, -0.31]],
  updatedAt: '2026-01-01T08:00:00.000Z',
  ...overrides,
});

const makeIncident = (overrides: Partial<Incident> = {}): Incident => ({
  id: 'i1', roadId: 'r1', category: 'Accident', magnitude: 'Minor',
  description: 'Minor accident', from: 'A', to: 'B', source: 'tomtom', ...overrides,
});

describe('RoadCard', () => {
  it('renders road name', () => {
    render(<RoadCard road={ROAD} selected={false} onSelect={noop} status={makeStatus()} onDelete={vi.fn()} />);
    expect(screen.getByText('A41: West Hampstead → Elstree')).toBeInTheDocument();
  });

  it('shows Loading state when status is undefined', () => {
    render(<RoadCard road={ROAD} selected={false} onSelect={noop} status={undefined} onDelete={vi.fn()} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.getByText('Fetching route…')).toBeInTheDocument();
  });

  it('shows journey time and usual time', () => {
    render(<RoadCard road={ROAD} selected={false} onSelect={noop} status={makeStatus({ journeyTimeSeconds: 1200, noTrafficTimeSeconds: 900 })} onDelete={vi.fn()} />);
    expect(screen.getByText('20 min')).toBeInTheDocument();
    expect(screen.getByText('usual 15 min')).toBeInTheDocument();
  });

  it('shows delay when delaySeconds > 0', () => {
    render(<RoadCard road={ROAD} selected={false} onSelect={noop} status={makeStatus({ delaySeconds: 300 })} onDelete={vi.fn()} />);
    expect(screen.getByText('+5 min delay')).toBeInTheDocument();
  });

  it('shows Clear status with no delay', () => {
    render(<RoadCard road={ROAD} selected={false} onSelect={noop} status={makeStatus({ delaySeconds: 0 })} onDelete={vi.fn()} />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('No reported incidents')).toBeInTheDocument();
  });

  it('shows Delays for delay > 180s', () => {
    render(<RoadCard road={ROAD} selected={false} onSelect={noop} status={makeStatus({ delaySeconds: 300 })} onDelete={vi.fn()} />);
    expect(screen.getByText('Delays')).toBeInTheDocument();
  });

  it('shows Major delays for delay > 600s', () => {
    render(<RoadCard road={ROAD} selected={false} onSelect={noop} status={makeStatus({ delaySeconds: 700 })} onDelete={vi.fn()} />);
    expect(screen.getByText('Major delays')).toBeInTheDocument();
  });

  it('shows Minor delay for delay between 0 and 180s', () => {
    render(<RoadCard road={ROAD} selected={false} onSelect={noop} status={makeStatus({ delaySeconds: 60 })} onDelete={vi.fn()} />);
    expect(screen.getByText('Minor delay')).toBeInTheDocument();
  });

  it('calls onDelete with road id when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<RoadCard road={ROAD} selected={false} onSelect={noop} status={makeStatus()} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('Remove A41: West Hampstead → Elstree'));
    expect(onDelete).toHaveBeenCalledWith('r1');
  });

  it('renders incident badges for each incident', () => {
    const status = makeStatus({ incidents: [
      makeIncident({ id: 'i1', description: 'Crash ahead' }),
      makeIncident({ id: 'i2', description: 'Road works' }),
    ]});
    render(<RoadCard road={ROAD} selected={false} onSelect={noop} status={status} onDelete={vi.fn()} />);
    expect(screen.getByText('Crash ahead')).toBeInTheDocument();
    expect(screen.getByText('Road works')).toBeInTheDocument();
  });
});
