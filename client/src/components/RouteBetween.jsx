import { useState } from 'react';
import { routeBetween } from '../api.js';
import { formatSegmentDateTime } from '../utils/formatRoute.js';
import { segmentNote } from '../utils/segmentNote.js';
import { StationAutocomplete } from './StationAutocomplete.jsx';

export function RouteBetween() {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [segments, setSegments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function load(offset = 0) {
    if (!from?.code || !to?.code) {
      setErr('Укажите обе станции');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const data = await routeBetween(from.code, to.code, { date, offset, limit: 50 });
      setPagination(data.pagination || null);
      if (offset === 0) setSegments(data.segments || []);
      else setSegments((prev) => [...prev, ...(data.segments || [])]);
    } catch (e) {
      setErr(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h2>Между станциями</h2>
      <StationAutocomplete label="Откуда" value={from} onSelect={setFrom} placeholder="Станция отправления" />
      <StationAutocomplete label="Куда" value={to} onSelect={setTo} placeholder="Станция назначения" />
      <label className="field-inline field-inline--block">
        <span>Дата</span>
        <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <button type="button" className="btn btn--primary" disabled={loading} onClick={() => load(0)}>
        {loading ? '...' : 'Показать'}
      </button>
      {err && <p className="error">{err}</p>}
      {segments.length > 0 && (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Отправл.</th>
                <th>Прибытие</th>
                <th>Рейс</th>
                <th>Примечание</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg, i) => (
                <tr key={seg.thread?.uid || i}>
                  <td>{formatSegmentDateTime(seg.departure)}</td>
                  <td>{formatSegmentDateTime(seg.arrival)}</td>
                  <td>{seg.thread?.title || seg.thread?.number || '—'}</td>
                  <td className="days">{segmentNote(seg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pagination && segments.length < (pagination.total || 0) && (
        <button type="button" className="btn" disabled={loading} onClick={() => load(segments.length)}>
          Ещё
        </button>
      )}
    </section>
  );
}
