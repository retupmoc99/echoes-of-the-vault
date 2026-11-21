import type { SaveStorage } from '../engine';

/**
 * localStorage, but never throws. Private browsing or a full disk would
 * otherwise crash the game; instead we fall back to memory and warn.
 */
export function createSafeStorage(): SaveStorage & { persistent: boolean } {
  // Ask the browser not to evict our data under storage pressure (granted
  // silently for installed apps on most browsers; harmless if refused).
  navigator.storage?.persist?.().catch(() => undefined);
  try {
    const probe = '__eotv_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return {
      persistent: true,
      getItem: (k) => window.localStorage.getItem(k),
      setItem: (k, v) => {
        try {
          window.localStorage.setItem(k, v);
        } catch (err) {
          console.warn('Save failed', err);
        }
      },
    };
  } catch {
    const mem = new Map<string, string>();
    return { persistent: false, getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) };
  }
}
