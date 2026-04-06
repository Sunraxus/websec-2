function apiOrigin() {
  const fromEnv = import.meta.env.VITE_SERVER_URL;
  if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
    return fromEnv.replace(/\/$/, '');
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
}

async function getJson(path, params = {}) {
  const base = apiOrigin();
  const u = new URL(path.startsWith('/') ? path : `/${path}`, base || 'http://localhost');
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v));
  });
  let res;
  try {
    res = await fetch(u.toString());
  } catch (e) {
    const m = e?.message || '';
    throw new Error('Нет ответа от сервера. Запусти npm start и открой адрес Vite.' + (m ? ' ' + m : ''));
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'Ошибка запроса');
  return data;
}

export function suggestStations(q) {
  return getJson('/api/suggest', { q });
}

export function nearestStations(lat, lng, distance = 50) {
  return getJson('/api/nearest', { lat, lng, distance, limit: 30 });
}

export function stationSchedule(station, opts = {}) {
  return getJson('/api/schedule/station', {
    station,
    date: opts.date || '',
    direction: opts.direction || '',
    event: opts.event || 'departure',
    offset: opts.offset ?? 0,
    limit: opts.limit ?? 50,
  });
}

export function routeBetween(from, to, opts = {}) {
  return getJson('/api/search/route', {
    from,
    to,
    date: opts.date || '',
    offset: opts.offset ?? 0,
    limit: opts.limit ?? 50,
  });
}
