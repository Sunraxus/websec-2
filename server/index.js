import path from 'path';
import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const RASP_BASES = [
  'https://api.rasp.yandex-net.ru/v3.0/',
  'https://api.rasp.yandex.net/v3.0/',
];
const apiKey = process.env.YANDEX_API_KEY;

const app = express();
const port = Number(process.env.SERVER_PORT || 3001);

app.use(cors());
app.use(express.json());

function raspUrl(base, pathname, params) {
  const rel = String(pathname).replace(/^\/+/, '');
  const u = new URL(rel, base);
  u.searchParams.set('apikey', apiKey);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') u.searchParams.set(k, String(v));
  }
  return u.toString();
}

async function fetchJson(url) {
  let res;
  try {
    res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
  } catch (e) {
    const cause = e.cause?.message || e.cause?.code || '';
    const extra = cause ? ` (${cause})` : '';
    throw new Error((e.message || 'Ошибка сети') + extra);
  }
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Некорректный ответ API: ${res.status}`);
  }
  if (!res.ok) {
    const msg = data?.error?.text || text || res.statusText;
    throw new Error(msg);
  }
  return data;
}

function isNetworkFailure(err) {
  if (err instanceof TypeError) return true;
  const m = String(err?.message || '');
  return /fetch failed|Ошибка сети|ECONNRESET|ETIMEDOUT|ENOTFOUND|getaddrinfo|certificate/i.test(m);
}

async function fetchRasp(pathname, params) {
  let lastErr;
  for (const base of RASP_BASES) {
    try {
      const url = raspUrl(base, pathname, params);
      return await fetchJson(url);
    } catch (e) {
      lastErr = e;
      if (!isNetworkFailure(e)) throw e;
    }
  }
  throw lastErr;
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: Boolean(apiKey) });
});

const NON_RAIL_HINT = new RegExp(
  [
    'автобус',
    'автовокзал',
    'электробус',
    'троллейбус',
    'трамвай',
    '\\bметро\\b',
    'маршрутн',
    'аэропорт',
    'самол[её]т',
    'речн(ой|ого)\\s+вокзал',
    'причал',
    'теплоход',
    'вертол[её]т',
    'водн(ой|ого)\\s+транспорт',
    'остановка\\s+общ',
    'канатн',
    '\\bbus\\b',
    '\\btram\\b',
    'trolley',
    'subway',
  ].join('|'),
  'i'
);

function looksLikeRailStop(title, subtitle) {
  const t = `${title || ''} ${subtitle || ''}`;
  return !NON_RAIL_HINT.test(t);
}

const trainStationCache = new Map();

async function isYandexTrainStation(code) {
  if (trainStationCache.has(code)) return trainStationCache.get(code);
  try {
    const data = await fetchRasp('schedule/', {
      station: code,
      transport_types: 'suburban',
      limit: 1,
      lang: 'ru_RU',
    });
    const st = data.station;
    const ok = Boolean(st && st.transport_type === 'train');
    trainStationCache.set(code, ok);
    return ok;
  } catch (e) {
    if (isNetworkFailure(e)) throw e;
    trainStationCache.set(code, false);
    return false;
  }
}

async function keepOnlyTrainStations(items, limit) {
  const out = [];
  const chunkSize = 8;
  for (let i = 0; i < items.length && out.length < limit; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const flags = await Promise.all(chunk.map((it) => isYandexTrainStation(it.code)));
    for (let j = 0; j < chunk.length; j++) {
      if (flags[j]) {
        out.push(chunk[j]);
        if (out.length >= limit) break;
      }
    }
  }
  return out;
}

app.get('/api/suggest', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ items: [] });
  try {
    const url = `https://suggests.rasp.yandex.net/all_suggests?format=old&part=${encodeURIComponent(q)}`;
    const data = await fetchJson(url);
    const rows = Array.isArray(data) && data[1] ? data[1] : [];
    const rough = rows
      .filter((row) => row[0] && String(row[0]).startsWith('s'))
      .map((row) => ({
        code: row[0],
        title: row[1],
        subtitle: row[2] || '',
      }))
      .filter((it) => looksLikeRailStop(it.title, it.subtitle))
      .slice(0, 35);
    const items = await keepOnlyTrainStations(rough, 20);
    res.json({ items });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get('/api/nearest', async (req, res) => {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const distance = req.query.distance || '50';
  if (!lat || !lng) return res.status(400).json({ error: 'Нужны lat и lng' });
  try {
    const data = await fetchRasp('nearest_stations/', {
      lat,
      lng,
      distance,
      limit: req.query.limit || '30',
      lang: 'ru_RU',
    });
    const stations = (data.stations || []).filter((s) => {
      const tc = s.type_choices || {};
      return s.station_type === 'train_station' && tc.suburban;
    });
    res.json({ stations, pagination: data.pagination });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get('/api/schedule/station', async (req, res) => {
  const station = req.query.station;
  if (!station) return res.status(400).json({ error: 'Нужен код станции' });
  try {
    const data = await fetchRasp('schedule/', {
      station,
      transport_types: 'suburban',
      lang: 'ru_RU',
      date: req.query.date || '',
      direction: req.query.direction || '',
      event: req.query.event || 'departure',
      offset: req.query.offset || '0',
      limit: req.query.limit || '50',
    });
    res.json({
      station: data.station,
      schedule: data.schedule || [],
      directions: data.directions || [],
      schedule_direction: data.schedule_direction,
      pagination: data.pagination,
      date: data.date,
    });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get('/api/search/route', async (req, res) => {
  const from = req.query.from;
  const to = req.query.to;
  if (!from || !to) return res.status(400).json({ error: 'Нужны from и to' });
  try {
    const data = await fetchRasp('search/', {
      from,
      to,
      transport_types: 'suburban',
      lang: 'ru_RU',
      date: req.query.date || '',
      offset: req.query.offset || '0',
      limit: req.query.limit || '50',
    });
    res.json({
      search: data.search,
      segments: data.segments || [],
      interval_segments: data.interval_segments || [],
      pagination: data.pagination,
    });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

const server = http.createServer(app);
let listenPort = port;

function onListening() {
  console.log('api http://127.0.0.1:' + listenPort);
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && listenPort < port + 40) {
    listenPort += 1;
    server.listen(listenPort, '127.0.0.1', onListening);
  } else {
    console.error(err);
    process.exit(1);
  }
});

server.listen(listenPort, '127.0.0.1', onListening);
