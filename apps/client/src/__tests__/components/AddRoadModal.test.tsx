import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { GeocodeSuggestion } from '@cartrack/shared';

const mockApi = {
  geocode: { search: vi.fn() },
};
vi.mock('@client/api/client.js', () => ({ api: mockApi }));

const { AddRoadModal } = await import('@client/components/AddRoadModal.js');

const SUGGESTION: GeocodeSuggestion = {
  displayName: 'A38, Bristol, UK',
  lat: 51.45,
  lon: -2.6,
  bbox: [-2.65, 51.4, -2.55, 51.5],
};

describe('AddRoadModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the modal title', () => {
    render(<AddRoadModal onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Add a road')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<AddRoadModal onAdd={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when ✕ button is clicked', () => {
    const onClose = vi.fn();
    render(<AddRoadModal onAdd={vi.fn()} onClose={onClose} />);
    // The ✕ close button (not Cancel)
    const closeButtons = screen.getAllByText('✕');
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not search when query is shorter than 2 chars', async () => {
    render(<AddRoadModal onAdd={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/A38 Bristol/);
    fireEvent.change(input, { target: { value: 'A' } });
    vi.runAllTimers();
    expect(mockApi.geocode.search).not.toHaveBeenCalled();
  });

  it('searches after debounce delay when query is 2+ chars', async () => {
    mockApi.geocode.search.mockResolvedValue([SUGGESTION]);
    render(<AddRoadModal onAdd={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/A38 Bristol/);
    fireEvent.change(input, { target: { value: 'M1' } });
    await act(async () => { vi.runAllTimers(); });
    expect(mockApi.geocode.search).toHaveBeenCalledWith('M1');
  });

  it('shows suggestions after search', async () => {
    mockApi.geocode.search.mockResolvedValue([SUGGESTION]);
    render(<AddRoadModal onAdd={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/A38 Bristol/);
    fireEvent.change(input, { target: { value: 'A38' } });
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(screen.getByText('A38, Bristol, UK')).toBeInTheDocument();
  });

  it('selects a suggestion and shows name/description fields', async () => {
    mockApi.geocode.search.mockResolvedValue([SUGGESTION]);
    render(<AddRoadModal onAdd={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/A38 Bristol/);
    fireEvent.change(input, { target: { value: 'A38' } });
    await act(async () => { await vi.runAllTimersAsync(); });
    fireEvent.click(screen.getByText('A38, Bristol, UK'));
    expect(screen.getByPlaceholderText(/A38 Morning Run/)).toBeInTheDocument();
  });

  it('submits when a suggestion with bbox is selected and name is filled', async () => {
    mockApi.geocode.search.mockResolvedValue([SUGGESTION]);
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<AddRoadModal onAdd={onAdd} onClose={onClose} />);

    // Search and select
    const searchInput = screen.getByPlaceholderText(/A38 Bristol/);
    fireEvent.change(searchInput, { target: { value: 'A38' } });
    await act(async () => { await vi.runAllTimersAsync(); });
    fireEvent.click(screen.getByText('A38, Bristol, UK'));

    // Fill in name
    const nameInput = screen.getByPlaceholderText(/A38 Morning Run/);
    fireEvent.change(nameInput, { target: { value: 'My Route' } });

    // Submit
    await act(async () => {
      fireEvent.click(screen.getByText('Add road'));
    });

    expect(onAdd).toHaveBeenCalledWith({
      name: 'My Route',
      description: undefined,
      bbox: SUGGESTION.bbox,
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('Add road button is disabled when no suggestion is selected', () => {
    render(<AddRoadModal onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Add road')).toBeDisabled();
  });
});
