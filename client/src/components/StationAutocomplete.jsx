import { useEffect, useRef, useState } from 'react';
import { suggestStations } from '../api.js';

export function StationAutocomplete({ label, value, onSelect, placeholder }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (value?.title) setQuery(value.title);
  }, [value?.code, value?.title]);

  useEffect(() => {
    const timerId = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const data = await suggestStations(query.trim());
        setSuggestions(data.items || []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    function close(event) {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setIsOpen(false);
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
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />
      {loading && <span className="field__hint">Поиск</span>}
      {isOpen && suggestions.length > 0 && (
        <ul className="suggest" role="listbox">
          {suggestions.map((station) => (
            <li key={station.code}>
              <button
                type="button"
                className="suggest__btn"
                onClick={() => {
                  onSelect({ code: station.code, title: station.title });
                  setQuery(station.title);
                  setIsOpen(false);
                }}
              >
                <span className="suggest__title">{station.title}</span>
                {station.subtitle && <span className="suggest__sub">{station.subtitle}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
