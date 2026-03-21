import type { Road, Incident } from '@cartrack/shared';
import { IncidentBadge } from '@client/components/IncidentBadge.js';

interface Props {
  road: Road;
  incidents: Incident[];
  onDelete: (id: string) => void;
}

function statusColour(incidents: Incident[]) {
  if (incidents.some((i) => i.magnitude === 'Major' || i.category === 'RoadClosed'))
    return 'border-red-400 bg-red-50';
  if (incidents.some((i) => i.magnitude === 'Moderate' || i.category === 'Jam'))
    return 'border-orange-400 bg-orange-50';
  if (incidents.length > 0)
    return 'border-yellow-400 bg-yellow-50';
  return 'border-green-400 bg-green-50';
}

function statusLabel(incidents: Incident[]) {
  if (incidents.some((i) => i.category === 'RoadClosed')) return 'Closed';
  if (incidents.some((i) => i.magnitude === 'Major')) return 'Major incident';
  if (incidents.some((i) => i.magnitude === 'Moderate')) return 'Delays';
  if (incidents.length > 0) return 'Minor issues';
  return 'Clear';
}

export function RoadCard({ road, incidents, onDelete }: Props) {
  const colour = statusColour(incidents);
  const label = statusLabel(incidents);

  return (
    <article className={`rounded-2xl border-2 ${colour} p-4 flex flex-col gap-3 shadow-sm`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900 text-base leading-tight">{road.name}</h2>
          {road.description && (
            <p className="text-xs text-gray-500 mt-0.5">{road.description}</p>
          )}
        </div>
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

      {incidents.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {incidents.map((inc) => (
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
    </article>
  );
}
