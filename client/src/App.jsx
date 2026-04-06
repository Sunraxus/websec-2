import { useCallback, useEffect, useState } from 'react';
import { StationAutocomplete } from './components/StationAutocomplete.jsx';
import { OlMap } from './components/OlMap.jsx';
import { StationSchedule } from './components/StationSchedule.jsx';
import { RouteBetween } from './components/RouteBetween.jsx';
import { Favorites } from './components/Favorites.jsx';
import { useFavorites } from './hooks/useFavorites.js';
import { storageGet, storageSet } from './utils/storage.js';

const THEME_KEY = 'theme';

export default function App() {
  const [tab, setTab] = useState('station');
  const [station, setStation] = useState(null);
  const [mapPick, setMapPick] = useState(null);
  const { items: favItems, add, remove, has } = useFavorites();

  const [theme, setTheme] = useState(() => storageGet(THEME_KEY, 'dark'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('color-scheme', theme === 'dark' ? 'dark' : 'light');
  }, [theme]);

  const applyTheme = useCallback((next) => {
    setTheme(next);
    storageSet(THEME_KEY, next);
  }, []);

  const onMapClick = useCallback((payload) => {
    setMapPick(payload);
  }, []);

  const selectFromMap = useCallback((st) => {
    setStation({ code: st.code, title: st.title });
    setMapPick(null);
  }, []);

  const onToggleFavorite = useCallback(
    (st) => {
      if (!st?.code) return;
      if (has(st.code)) remove(st.code);
      else add(st);
    },
    [add, remove, has]
  );

  const openFavorite = useCallback((s) => {
    setStation(s);
    setTab('station');
  }, []);

  return (
    <div className="app">
      <header className="top">
        <div className="top__brand">
          <h1 className="top__title">Прибывалка</h1>
          <p className="top__sub">Электрички</p>
        </div>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => applyTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        </button>
      </header>

      <nav className="tabs">
        <button
          type="button"
          className={'tab' + (tab === 'station' ? ' is-active' : '')}
          onClick={() => setTab('station')}
        >
          Станция
        </button>
        <button
          type="button"
          className={'tab' + (tab === 'route' ? ' is-active' : '')}
          onClick={() => setTab('route')}
        >
          Маршрут
        </button>
      </nav>

      <main className="layout">
        <div className="layout__main">
          {tab === 'station' && (
            <>
              <section className="card">
                <h2 className="card__title-only">Поиск станции</h2>
                <StationAutocomplete
                  label="Название"
                  value={station}
                  onSelect={setStation}
                  placeholder="Введите название"
                />
              </section>

              <section className="card">
                <h2 className="card__title-only">Карта</h2>
                <OlMap
                  onMapClick={onMapClick}
                  hint="Клик по карте — список ближайших станций с электричками"
                />
                {mapPick && mapPick.stations?.length > 0 && (
                  <div className="map-pick">
                    <p className="muted">Выберите станцию:</p>
                    <ul className="map-pick__list">
                      {mapPick.stations.map((st) => (
                        <li key={st.code}>
                          <button type="button" className="linkish" onClick={() => selectFromMap(st)}>
                            {st.title}
                            <span className="muted">, {st.distance?.toFixed?.(1) ?? '?'} км</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <button type="button" className="btn btn--ghost" onClick={() => setMapPick(null)}>
                      Закрыть
                    </button>
                  </div>
                )}
                {mapPick && (!mapPick.stations || mapPick.stations.length === 0) && (
                  <p className="error">Нет станций, попробуйте другую точку</p>
                )}
              </section>

              <StationSchedule
                station={station}
                favorites={{ has }}
                onToggleFavorite={onToggleFavorite}
              />
            </>
          )}

          {tab === 'route' && <RouteBetween />}
        </div>

        <Favorites items={favItems} onSelect={openFavorite} onRemove={remove} />
      </main>
    </div>
  );
}
