import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RoadCard } from '@client/components/RoadCard.js';
import type { Road, Incident } from '@cartrack/shared';

const ROAD: Road = {
  id: 'r1',
  name: 'A38 Bristol',
  description: 'Morning school run',
  bbox: [-2.6, 51.4, -2.5, 51.5],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const makeIncident = (overrides: Partial<Incident> = {}): Incident => ({
  id: 'i1',
  roadId: 'r1',
  category: 'Accident',
  magnitude: 'Minor',
  description: 'Minor accident',
  from: 'A',
  to: 'B',
  source: 'tomtom',
  ...overrides,
});

describe('RoadCard', () => {
  it('renders road name and description', () => {
    render(<RoadCard road={ROAD} incidents={[]} onDelete={vi.fn()} />);
    expect(screen.getByText('A38 Bristol')).toBeInTheDocument();
    expect(screen.getByText('Morning school run')).toBeInTheDocument();
  });

  it('shows Clear status with no incidents', () => {
    render(<RoadCard road={ROAD} incidents={[]} onDelete={vi.fn()} />);
    expect(screen.getByText('Clear')).toBeInTheDocument();
    expect(screen.getByText('No reported incidents')).toBeInTheDocument();
  });

  it('shows Minor issues status for minor incidents', () => {
    render(<RoadCard road={ROAD} incidents={[makeIncident()]} onDelete={vi.fn()} />);
    expect(screen.getByText('Minor issues')).toBeInTheDocument();
  });

  it('shows Delays status for moderate incidents', () => {
    render(
      <RoadCard
        road={ROAD}
        incidents={[makeIncident({ magnitude: 'Moderate', category: 'Jam' })]}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Delays')).toBeInTheDocument();
  });

  it('shows Major incident status for major magnitude', () => {
    render(
      <RoadCard
        road={ROAD}
        incidents={[makeIncident({ magnitude: 'Major' })]}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Major incident')).toBeInTheDocument();
  });

  it('shows Closed status for RoadClosed category', () => {
    render(
      <RoadCard
        road={ROAD}
        incidents={[makeIncident({ category: 'RoadClosed', magnitude: 'Major' })]}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('calls onDelete with road id when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<RoadCard road={ROAD} incidents={[]} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('Remove A38 Bristol'));
    expect(onDelete).toHaveBeenCalledWith('r1');
  });

  it('renders incident badges for each incident', () => {
    const incidents = [
      makeIncident({ id: 'i1', description: 'Crash ahead' }),
      makeIncident({ id: 'i2', description: 'Road works' }),
    ];
    render(<RoadCard road={ROAD} incidents={incidents} onDelete={vi.fn()} />);
    expect(screen.getByText('Crash ahead')).toBeInTheDocument();
    expect(screen.getByText('Road works')).toBeInTheDocument();
  });

  it('does not render description when absent', () => {
    const roadNoDesc = { ...ROAD, description: undefined };
    const { container } = render(
      <RoadCard road={roadNoDesc} incidents={[]} onDelete={vi.fn()} />,
    );
    expect(container.querySelector('p.text-xs')).not.toBeInTheDocument();
  });
});
