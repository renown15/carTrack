import { useState, useRef } from 'react';
import type { GeocodeSuggestion, CreateRoadPayload } from '@cartrack/shared';
import { api } from '@client/api/client.js';

interface Props {
  onAdd: (payload: CreateRoadPayload) => Promise<void>;
  onClose: () => void;
}

export function AddRoadModal({ onAdd, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [selected, setSelected] = useState<GeocodeSuggestion | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.geocode.search(val);
        setSuggestions(results);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelect = (s: GeocodeSuggestion) => {
    setSelected(s);
    setSuggestions([]);
    setQuery(s.displayName);
    if (!name) setName(s.displayName.split(',')[0]);
  };

  const handleSubmit = async () => {
    if (!selected?.bbox || !name.trim()) return;
    setSaving(true);
    try {
      await onAdd({
        name: name.trim(),
        description: description.trim() || undefined,
        bbox: selected.bbox,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Add a road</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">✕</button>
        </div>

        {/* Search */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search for road or location
          </label>
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="e.g. A38 Bristol, M5 Junction 15"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {searching && (
            <p className="text-xs text-gray-400 mt-1">Searching…</p>
          )}
          {suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    onClick={() => handleSelect(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                  >
                    {s.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. A38 Morning Run"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. School run — drop off"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected?.bbox || !name.trim() || saving}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-brand-700"
          >
            {saving ? 'Adding…' : 'Add road'}
          </button>
        </div>
      </div>
    </div>
  );
}
