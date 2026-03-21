import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Road } from '@cartrack/shared';

const ROAD: Road = {
  id: 'r1',
  name: 'A38 Bristol',
  bbox: [-2.6, 51.4, -2.5, 51.5],
  createdAt: '2026-01-01T00:00:00.000Z',
};

vi.mock('@client/hooks/useRoads.js', () => ({
  useRoads: () => ({
    roads: [ROAD],
    loading: false,
    error: null,
    addRoad: vi.fn(),
    removeRoad: vi.fn(),
  }),
}));

vi.mock('@client/hooks/useIncidents.js', () => ({
  useIncidents: () => ({
    incidentsByRoad: () => [],
    loading: false,
    lastUpdated: null,
    refresh: vi.fn(),
  }),
}));

const { App } = await import('@client/App.js');

describe('App', () => {
  it('renders the CarTrack header', () => {
    render(<App />);
    expect(screen.getByText('CarTrack')).toBeInTheDocument();
  });

  it('renders a road card for each road', () => {
    render(<App />);
    expect(screen.getByText('A38 Bristol')).toBeInTheDocument();
  });

  it('renders the Add road button', () => {
    render(<App />);
    expect(screen.getByText('+ Add road')).toBeInTheDocument();
  });
});
