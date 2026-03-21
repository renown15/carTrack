import { useState } from 'react';
import { useRoads } from '@client/hooks/useRoads.js';
import { useIncidents } from '@client/hooks/useIncidents.js';
import { RoadCard } from '@client/components/RoadCard.js';
import { AddRoadModal } from '@client/components/AddRoadModal.js';

export function App() {
  const { roads, loading: roadsLoading, error: roadsError, addRoad, removeRoad } = useRoads();
  const { incidentsByRoad, loading: incidentsLoading, lastUpdated, refresh } = useIncidents(
    roads.map((r) => r.id),
  );
  const [showAdd, setShowAdd] = useState(false);

  const updated = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-brand-600 text-white px-4 pt-safe-top py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-lg font-bold tracking-tight">CarTrack</h1>
          {updated && (
            <p className="text-xs text-brand-50 opacity-80">Updated {updated}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refresh()}
            disabled={incidentsLoading}
            aria-label="Refresh"
            className="p-2 rounded-full hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-5 h-5 ${incidentsLoading ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h5M20 20v-5h-5M4 9a8 8 0 0114.93-3M20 15a8 8 0 01-14.93 3" />
            </svg>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 bg-white text-brand-700 font-semibold text-sm px-3 py-1.5 rounded-full hover:bg-brand-50 transition-colors"
          >
            + Add road
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 px-4 py-5 max-w-lg mx-auto w-full">
        {roadsLoading && (
          <p className="text-center text-gray-400 mt-10">Loading…</p>
        )}

        {roadsError && (
          <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {roadsError}
          </div>
        )}

        {!roadsLoading && roads.length === 0 && (
          <div className="text-center mt-16 flex flex-col items-center gap-3">
            <span className="text-5xl">🗺️</span>
            <p className="text-gray-500 text-sm max-w-xs">
              No roads configured yet. Tap <strong>+ Add road</strong> to start monitoring your school run.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {roads.map((road) => (
            <RoadCard
              key={road.id}
              road={road}
              incidents={incidentsByRoad(road.id)}
              onDelete={(id) => void removeRoad(id)}
            />
          ))}
        </div>
      </main>

      {showAdd && (
        <AddRoadModal
          onAdd={async (payload) => { await addRoad(payload); }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
