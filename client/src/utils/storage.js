function isLocalStorageAvailable() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function storageGet(key, fallback = null) {
  try {
    if (!isLocalStorageAvailable()) return fallback;
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

export function storageSet(key, value) {
  try {
    if (!isLocalStorageAvailable()) return;
    window.localStorage.setItem(key, value);
  } catch {}
}
