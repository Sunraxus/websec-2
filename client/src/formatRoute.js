function ruDateTime(d) {
  const datePart = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  const timePart = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${datePart}, ${timePart}`;
}

export function formatSegmentDateTime(value) {
  if (value == null || value === '') return '—';
  if (typeof value !== 'string') return String(value);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return ruDateTime(d);
}

/**
 * Расписание по станции: API часто отдаёт только "ЧЧ:ММ", иногда полную ISO-строку.
 * contextDate — выбранная дата "YYYY-MM-DD".
 */
export function formatBoardTime(value, contextDate) {
  if (value == null || value === '') return '—';
  const s = String(value).trim();
  if (!s) return '—';

  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    return formatSegmentDateTime(s);
  }

  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ss = m[3] != null ? parseInt(m[3], 10) : 0;
    if (
      contextDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(contextDate) &&
      Number.isFinite(hh) &&
      Number.isFinite(mm)
    ) {
      const [y, mo, da] = contextDate.split('-').map((x) => parseInt(x, 10));
      const d = new Date(y, mo - 1, da, hh, mm, ss);
      if (!Number.isNaN(d.getTime())) return ruDateTime(d);
    }
    const t = new Date(2000, 0, 1, hh, mm, ss);
    return t.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  return s;
}

export function formatDurationSeconds(sec) {
  if (sec == null || typeof sec !== 'number' || !Number.isFinite(sec)) return null;
  const m = Math.round(sec / 60);
  if (m < 1) return '< 1 мин';
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} мин`;
  if (rest === 0) return `${h} ч`;
  return `${h} ч ${rest} мин`;
}
