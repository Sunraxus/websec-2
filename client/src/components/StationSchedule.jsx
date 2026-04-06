import { useCallback, useEffect, useState } from 'react';
import { stationSchedule } from '../api.js';
import { formatBoardTime } from '../utils/formatRoute.js';

export function StationSchedule({ station, favorites, onToggleFavorite }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [direction, setDirection] = useState('');
  const [rows, setRows] = useState([]);
  const [directions, setDirections] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(
    async (offset = 0) => {
      if (!station?.code) return;
      setLoading(true);
      setErr('');
      try {
        const data = await stationSchedule(station.code, {
          date,
          direction,
          offset,
          limit: 50,
        });
        setDirections(data.directions || []);
        setPagination(data.pagination || null);
        if (offset === 0) setRows(data.schedule || []);
        else setRows((prev) => [...prev, ...(data.schedule || [])]);
      } catch (e) {
        setErr(e.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    },
    [station?.code, date, direction]
  );

  useEffect(() => {
    if (!station?.code) {
      setRows([]);
      setPagination(null);
      setDirections([]);
      return;
    }
    load(0);
  }, [station?.code, date, direction, load]);

  const favActive = station?.code && favorites.has(station.code);

  return (
    <section className="card">
      <div className="card__head">
        <h2 id="sched-title">Расписание</h2>
        {station?.code && (
          <button
            type="button"
            className={'btn btn--ghost' + (favActive ? ' is-on' : '')}
            onClick={() => onToggleFavorite?.(station)}
            aria-pressed={favActive}
          >
            {favActive ? 'Убрать из избранного' : 'В избранное'}
          </button>
        )}
      </div>
      {!station?.code && <p className="muted">Выберите станцию</p>}
      {station?.code && (
        <>
          <p className="station-name">{station.title}</p>
          <div className="row row--wrap">
            <label className="field-inline">
              <span>Дата</span>
              <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field-inline">
              <span>Направление</span>
              <select
                className="input"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
              >
                <option value="">Все</option>
                {directions.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {err && <p className="error">{err}</p>}
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Поезд</th>
                  <th>Куда</th>
                  <th>Платф.</th>
                  <th>Дни</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.thread?.uid || i}>
                    <td>{formatBoardTime(row.departure, date)}</td>
                    <td>
                      <span className="thread-title">{row.thread?.title || row.thread?.number || '—'}</span>
                    </td>
                    <td>{row.direction || '—'}</td>
                    <td>{row.platform || '—'}</td>
                    <td className="days">{row.days || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && <p className="muted">Загрузка</p>}
          {pagination && rows.length < (pagination.total || 0) && (
            <button type="button" className="btn" disabled={loading} onClick={() => load(rows.length)}>
              Ещё
            </button>
          )}
        </>
      )}
    </section>
  );
}
