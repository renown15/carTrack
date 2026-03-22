import { useState, useRef } from 'react';
import type { GeocodeSuggestion } from '@cartrack/shared';
import { api } from '@client/api/client.js';

export interface LocationSearch {
  query: string;
  suggestions: GeocodeSuggestion[];
  selected: GeocodeSuggestion | null;
  searching: boolean;
  onChange: (val: string) => void;
  select: (s: GeocodeSuggestion) => void;
  clear: () => void;
}

export function useLocationSearch(): LocationSearch {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [selected, setSelected] = useState<GeocodeSuggestion | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = (val: string) => {
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

  const select = (s: GeocodeSuggestion) => {
    setSelected(s);
    setSuggestions([]);
    setQuery(s.displayName.split(',')[0].trim());
  };

  const clear = () => {
    setSelected(null);
    setQuery('');
    setSuggestions([]);
  };

  return { query, suggestions, selected, searching, onChange, select, clear };
}
