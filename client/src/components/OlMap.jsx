import { useEffect, useRef } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import { nearestStations } from '../api.js';
import { DEFAULT_MAP_CENTER_LONLAT } from '../config.js';

const DEFAULT_CENTER = fromLonLat(DEFAULT_MAP_CENTER_LONLAT);

export function OlMap({ onMapClick, hint }) {
  const mapContainerRef = useRef(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    const el = mapContainerRef.current;
    if (!el) return;

    const map = new Map({
      target: el,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: DEFAULT_CENTER,
        zoom: 9,
      }),
    });

    map.on('singleclick', async (evt) => {
      const [lng, lat] = toLonLat(evt.coordinate);
      try {
        const data = await nearestStations(lat, lng, 50);
        onMapClickRef.current?.({ lat, lng, stations: data.stations || [] });
      } catch {
        onMapClickRef.current?.({ lat, lng, stations: [] });
      }
    });
  }, []);

  return (
    <div className="map-wrap">
      <p className="map-hint">{hint}</p>
      <div ref={mapContainerRef} className="map map--ol" />
    </div>
  );
}
