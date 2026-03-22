import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { GeocodeSuggestion } from '@cartrack/shared';

const mockApi = { geocode: { search: vi.fn() } };
vi.mock('@client/api/client.js', () => ({ api: mockApi }));

const { AddRoadModal } = await import('@client/components/AddRoadModal.js');

const FROM: GeocodeSuggestion = {
  displayName: 'West Hampstead, London, UK',
  lat: 51.55,
  lon: -0.19,
  bbox: [-0.2, 51.54, -0.18, 51.56],
};

const TO: GeocodeSuggestion = {
  displayName: 'Elstree, Hertfordshire, UK',
  lat: 51.65,
  lon: -0.31,
  bbox: [-0.32, 51.64, -0.30, 51.66],
};

async function searchAndSelect(placeholder: RegExp, suggestion: GeocodeSuggestion, query: string) {
  const input = screen.getByPlaceholderText(placeholder);
  fireEvent.change(input, { target: { value: query } });
  await act(async () => { await vi.runAllTimersAsync(); });
  fireEvent.click(screen.getByText(suggestion.displayName));
}

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

  it('renders Road, From, To fields', () => {
    render(<AddRoadModal onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/A41, M1/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/West Hampstead/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Elstree/)).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<AddRoadModal onAdd={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when ✕ is clicked', () => {
    const onClose = vi.fn();
    render(<AddRoadModal onAdd={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('Add road button is disabled before both endpoints are selected', () => {
    render(<AddRoadModal onAdd={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Add road')).toBeDisabled();
  });

  it('shows suggestions in From field after search', async () => {
    mockApi.geocode.search.mockResolvedValue([FROM]);
    render(<AddRoadModal onAdd={vi.fn()} onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/West Hampstead/);
    fireEvent.change(input, { target: { value: 'West' } });
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(screen.getByText(FROM.displayName)).toBeInTheDocument();
  });

  it('shows name field after both endpoints are selected', async () => {
    mockApi.geocode.search.mockResolvedValue([FROM]);
    render(<AddRoadModal onAdd={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/A41, M1/), { target: { value: 'A41' } });
    await searchAndSelect(/West Hampstead/, FROM, 'West');
    mockApi.geocode.search.mockResolvedValue([TO]);
    await searchAndSelect(/Elstree/, TO, 'Elst');
    expect(screen.getByPlaceholderText(/West Hampstead → Elstree/)).toBeInTheDocument();
  });

  it('auto-generates name from road + from + to', async () => {
    mockApi.geocode.search.mockResolvedValue([FROM]);
    render(<AddRoadModal onAdd={vi.fn()} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/A41, M1/), { target: { value: 'A41' } });
    await searchAndSelect(/West Hampstead/, FROM, 'West');
    mockApi.geocode.search.mockResolvedValue([TO]);
    await searchAndSelect(/Elstree/, TO, 'Elst');
    const nameInput = screen.getByPlaceholderText(/West Hampstead → Elstree/);
    expect((nameInput as HTMLInputElement).value).toBe('A41: West Hampstead → Elstree');
  });

  it('submits with union bbox and generated name', async () => {
    mockApi.geocode.search.mockResolvedValue([FROM]);
    const onAdd = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<AddRoadModal onAdd={onAdd} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText(/A41, M1/), { target: { value: 'A41' } });
    await searchAndSelect(/West Hampstead/, FROM, 'West');
    mockApi.geocode.search.mockResolvedValue([TO]);
    await searchAndSelect(/Elstree/, TO, 'Elst');
    await act(async () => {
      fireEvent.click(screen.getByText('Add road'));
    });
    // bbox is derived from centre lat/lon of each point + CORRIDOR_BUFFER (0.018°), not area bboxes
    expect(onAdd).toHaveBeenCalledWith({
      name: 'A41: West Hampstead → Elstree',
      originName: 'West Hampstead',
      destinationName: 'Elstree',
      origin: [FROM.lat, FROM.lon],
      destination: [TO.lat, TO.lon],
    });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
