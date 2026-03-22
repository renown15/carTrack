import { useState, useEffect } from 'react';
import type { CreateRoadPayload } from '@cartrack/shared';
import { useLocationSearch, type LocationSearch } from '@client/hooks/useLocationSearch.js';

interface Props {
  onAdd: (payload: CreateRoadPayload) => Promise<void>;
  onClose: () => void;
}


function LocationField({ label, placeholder, search }: {
  label: string;
  placeholder: string;
  search: LocationSearch;
}) {
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="search"
        value={search.query}
        onChange={(e) => search.onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      {search.searching && <p className="text-xs text-gray-400 mt-1">Searching…</p>}
      {search.suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {search.suggestions.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => search.select(s)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
              >
                {s.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AddRoadModal({ onAdd, onClose }: Props) {
  const [road, setRoad] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const from = useLocationSearch();
  const to = useLocationSearch();

  useEffect(() => {
    if (road.trim() && from.selected && to.selected) {
      setName(`${road.trim()}: ${from.query} → ${to.query}`);
    }
  }, [road, from.selected, from.query, to.selected, to.query]);

  const canSubmit = Boolean(road.trim() && from.selected && to.selected && name.trim());

  const handleSubmit = async () => {
    if (!canSubmit || !from.selected || !to.selected) return;
    setSaving(true);
    try {
      await onAdd({
        name: name.trim(),
        origin: [from.selected.lat, from.selected.lon],
        destination: [to.selected.lat, to.selected.lon],
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Add a road</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">✕</button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Road</label>
          <input
            type="text"
            value={road}
            onChange={(e) => setRoad(e.target.value)}
            placeholder="e.g. A41, M1, B4009"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <LocationField label="From" placeholder="e.g. West Hampstead" search={from} />
        <LocationField label="To" placeholder="e.g. Elstree" search={to} />

        {from.selected && to.selected && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. A41: West Hampstead → Elstree"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || saving}
            className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-medium disabled:opacity-40 hover:bg-brand-700"
          >
            {saving ? 'Adding…' : 'Add road'}
          </button>
        </div>
      </div>
    </div>
  );
}
