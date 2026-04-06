import { useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '../utils/storage.js';

const KEY = import.meta.env.VITE_FAVORITES_STORAGE_KEY || 'lab_fav_stops';

function read() {
  try {
    const raw = storageGet(KEY, '');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [items, setItems] = useState(read);

  useEffect(() => {
    storageSet(KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((station) => {
    if (!station?.code) return;
    setItems((prev) => {
      if (prev.some((x) => x.code === station.code)) return prev;
      return [...prev, { code: station.code, title: station.title || station.code }];
    });
  }, []);

  const remove = useCallback((code) => {
    setItems((prev) => prev.filter((x) => x.code !== code));
  }, []);

  const has = useCallback((code) => items.some((x) => x.code === code), [items]);

  return { items, add, remove, has };
}
