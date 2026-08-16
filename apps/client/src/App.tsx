import { useState } from 'react';
import { useRoads } from '@client/hooks/useRoads.js';
import { useRouteStatus } from '@client/hooks/useRouteStatus.js';
import { RoadCard } from '@client/components/RoadCard.js';
import { AddRoadModal } from '@client/components/AddRoadModal.js';
import { RoadMap } from '@client/components/RoadMap.js';

export function App() {
  const { roads, loading: roadsLoading, error: roadsError, addRoad, removeRoad } = useRoads();
  const { routeStatusByRoad, loading: routeLoading, lastUpdated, refresh } = useRouteStatus(
    roads.map((r) => r.id),
  );
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRoadId, setSelectedRoadId] = useState<string | null>(null);

  const updated = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-brand-600 text-white px-4 pt-safe-top py-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-lg font-bold tracking-tight">CarTrack</h1>
          {updated && <p className="text-xs text-brand-50 opacity-80">Updated {updated}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refresh()}
            disabled={routeLoading}
            aria-label="Refresh"
            className="p-2 rounded-full hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-5 h-5 ${routeLoading ? 'animate-spin' : ''}`}
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

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full min-h-0">
        {/* Cards panel */}
        <aside className="flex flex-col gap-4 lg:w-80 shrink-0">
          {roadsLoading && <p className="text-center text-gray-400 mt-10">Loading…</p>}

          {roadsError && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {roadsError}
            </div>
          )}

          {!roadsLoading && roads.length === 0 && (
            <div className="text-center mt-16 flex flex-col items-center gap-3">
              <span className="text-5xl">🗺️</span>
              <p className="text-gray-500 text-sm max-w-xs">
                No roads configured yet. Tap <strong>+ Add road</strong> to start monitoring.
              </p>
            </div>
          )}

          {roads.map((road) => (
            <RoadCard
              key={road.id}
              road={road}
              status={routeStatusByRoad(road.id)}
              selected={selectedRoadId === road.id}
              onSelect={setSelectedRoadId}
              onDelete={(id) => void removeRoad(id)}
            />
          ))}
        </aside>

        {/* Map panel */}
        <div className="flex-1 h-64 lg:h-auto shadow-sm min-h-0">
          <RoadMap
            roads={roads}
            routeStatusByRoad={routeStatusByRoad}
            selectedRoadId={selectedRoadId}
            onSelectRoad={setSelectedRoadId}
          />
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
