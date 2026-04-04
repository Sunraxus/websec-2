import { useEffect, useRef, useState } from 'react';
import { suggestStations } from '../api.js';

export function StationAutocomplete({ label, value, onSelect, placeholder }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (value?.title) setQ(value.title);
  }, [value?.code, value?.title]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (q.trim().length < 2) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const data = await suggestStations(q.trim());
        setItems(data.items || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function close(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <div className="field" ref={wrapRef}>
      <label className="field__label">{label}</label>
      <input
        type="search"
        className="input"
        autoComplete="off"
        placeholder={placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {loading && <span className="field__hint">Поиск</span>}
      {open && items.length > 0 && (
        <ul className="suggest" role="listbox">
          {items.map((it) => (
            <li key={it.code}>
              <button
                type="button"
                className="suggest__btn"
                onClick={() => {
                  onSelect({ code: it.code, title: it.title });
                  setQ(it.title);
                  setOpen(false);
                }}
              >
                <span className="suggest__title">{it.title}</span>
                {it.subtitle && <span className="suggest__sub">{it.subtitle}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
