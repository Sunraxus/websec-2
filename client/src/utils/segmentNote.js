import { formatDurationSeconds } from './formatRoute.js';

export function segmentNote(seg) {
  const dur = formatDurationSeconds(seg.duration);
  const stops = seg.stops;
  if (dur && stops) return `${dur} · ${stops}`;
  if (dur) return dur;
  return stops || '—';
}
