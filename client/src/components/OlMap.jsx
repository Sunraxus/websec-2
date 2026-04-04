import { useEffect, useRef } from 'react';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import { nearestStations } from '../api.js';

const MOSCOW = fromLonLat([37.62, 55.75]);

export function OlMap({ onMapClick, hint }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;

    const map = new Map({
      target: el,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: MOSCOW,
        zoom: 9,
      }),
    });
    mapRef.current = map;

    map.on('singleclick', async (evt) => {
      const [lng, lat] = toLonLat(evt.coordinate);
      try {
        const data = await nearestStations(lat, lng, 50);
        onMapClickRef.current?.({ lat, lng, stations: data.stations || [] });
      } catch {
        onMapClickRef.current?.({ lat, lng, stations: [] });
      }
    });

    return () => {
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="map-wrap">
      <p className="map-hint">{hint}</p>
      <div ref={hostRef} className="map map--ol" />
    </div>
  );
}
