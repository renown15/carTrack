import type { Road, RouteStatus } from '@cartrack/shared';
import { IncidentBadge } from '@client/components/IncidentBadge.js';

interface Props {
  road: Road;
  status: RouteStatus | undefined;
  onDelete: (id: string) => void;
}

function delayColour(delaySeconds: number) {
  if (delaySeconds > 600) return 'border-red-400 bg-red-50';
  if (delaySeconds > 180) return 'border-orange-400 bg-orange-50';
  if (delaySeconds > 0)   return 'border-yellow-400 bg-yellow-50';
  return 'border-green-400 bg-green-50';
}

function delayLabel(delaySeconds: number) {
  if (delaySeconds > 600) return 'Major delays';
  if (delaySeconds > 180) return 'Delays';
  if (delaySeconds > 0)   return 'Minor delay';
  return 'Clear';
}

function fmt(seconds: number) {
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function RoadCard({ road, status, onDelete }: Props) {
  const colour = status ? delayColour(status.delaySeconds) : 'border-gray-300 bg-gray-50';
  const label  = status ? delayLabel(status.delaySeconds)  : 'Loading…';

  return (
    <article className={`rounded-2xl border-2 ${colour} p-4 flex flex-col gap-3 shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-gray-900 text-base leading-tight">{road.name}</h2>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/70 border border-current">
            {label}
          </span>
          <button
            onClick={() => onDelete(road.id)}
            aria-label={`Remove ${road.name}`}
            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white/60"
          >
            ✕
          </button>
        </div>
      </div>

      {status ? (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">{fmt(status.journeyTimeSeconds)}</span>
            {status.delaySeconds > 0 && (
              <span className="text-sm font-medium text-orange-600">
                +{fmt(status.delaySeconds)} delay
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">
              usual {fmt(status.noTrafficTimeSeconds)}
            </span>
          </div>

          {status.incidents.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {status.incidents.map((inc) => (
                <li key={inc.id}>
                  <IncidentBadge
                    category={inc.category}
                    magnitude={inc.magnitude}
                    description={inc.description}
                    delay={inc.delay}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-green-700">No reported incidents</p>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-400">Fetching route…</p>
      )}
    </article>
  );
}
