import type { IncidentCategory, IncidentMagnitude } from '@cartrack/shared';

const CATEGORY_ICONS: Record<IncidentCategory, string> = {
  Unknown: '❓',
  Accident: '💥',
  Fog: '🌫️',
  DangerousConditions: '⚠️',
  Rain: '🌧️',
  Ice: '🧊',
  Jam: '🚦',
  LaneClosed: '🔶',
  RoadClosed: '🚫',
  RoadWorks: '🚧',
  Wind: '💨',
  Flooding: '🌊',
  Other: '⚠️',
};

const MAGNITUDE_COLOURS: Record<IncidentMagnitude, string> = {
  Unknown: 'bg-gray-100 text-gray-700',
  Minor: 'bg-yellow-100 text-yellow-800',
  Moderate: 'bg-orange-100 text-orange-800',
  Major: 'bg-red-100 text-red-800',
  Undefined: 'bg-gray-100 text-gray-700',
};

interface Props {
  category: IncidentCategory;
  magnitude: IncidentMagnitude;
  description: string;
  delay?: number;
}

export function IncidentBadge({ category, magnitude, description, delay }: Props) {
  const colour = MAGNITUDE_COLOURS[magnitude];
  const icon = CATEGORY_ICONS[category];
  const delayMins = delay ? Math.round(delay / 60) : null;

  return (
    <div className={`rounded-lg px-3 py-2 text-sm ${colour} flex items-start gap-2`}>
      <span className="text-base leading-tight shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="font-medium leading-snug">{description}</p>
        {delayMins !== null && delayMins > 0 && (
          <p className="text-xs mt-0.5 opacity-75">+{delayMins} min delay</p>
        )}
      </div>
    </div>
  );
}
