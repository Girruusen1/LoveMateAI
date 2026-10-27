import { useCallback, useSyncExternalStore } from 'react';

/**
 * Photos attached to items that already exist.
 *
 * New milestones / scrapbook pages carry their photo in `photoUrl` on the item itself (passed to
 * addMilestone / addSharedMemory), so it persists and syncs with the item. AppContext does not yet
 * expose updateMilestone / updateSharedMemory, so photos added to EXISTING items are kept here,
 * keyed by item id, in their own localStorage key. Once an update function exists, swap
 * `setPhoto(id, url)` for that call and this store can go away.
 *
 * Same budget as item photos: ~150 KB per image, 30 per collection (cloud sync: 2 MB per key).
 */

type PhotoMap = Record<string, string>;

const cache = new Map<string, PhotoMap>();
const listeners = new Map<string, Set<() => void>>();

function read(key: string): PhotoMap {
  const cached = cache.get(key);
  if (cached) return cached;
  let map: PhotoMap = {};
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') map = parsed as PhotoMap;
    }
  } catch {
    /* corrupt or unavailable storage: start empty */
  }
  cache.set(key, map);
  return map;
}

function write(key: string, map: PhotoMap) {
  cache.set(key, map);
  try {
    localStorage.setItem(key, JSON.stringify(map));
  } catch {
    /* quota exceeded: keep the in-memory copy so the UI still works this session */
  }
  listeners.get(key)?.forEach((fn) => fn());
}

export function useItemPhotos(storageKey: string) {
  const subscribe = useCallback(
    (fn: () => void) => {
      if (!listeners.has(storageKey)) listeners.set(storageKey, new Set());
      listeners.get(storageKey)!.add(fn);
      return () => {
        listeners.get(storageKey)?.delete(fn);
      };
    },
    [storageKey]
  );
  const photos = useSyncExternalStore(subscribe, () => read(storageKey), () => ({}) as PhotoMap);

  /**
   * dataUrl: a photo to show for this item; '' hides the photo stored on the item itself
   * (a "removed" tombstone); null clears the override so the item's own photo shows again.
   */
  const setPhoto = useCallback(
    (id: string, dataUrl: string | null) => {
      const next = { ...read(storageKey) };
      if (dataUrl === null) delete next[id];
      else next[id] = dataUrl;
      write(storageKey, next);
    },
    [storageKey]
  );

  /** Drop entries whose item no longer exists. */
  const prune = useCallback(
    (liveIds: Set<string>) => {
      const current = read(storageKey);
      const stale = Object.keys(current).filter((id) => !liveIds.has(id));
      if (!stale.length) return;
      const next = { ...current };
      stale.forEach((id) => delete next[id]);
      write(storageKey, next);
    },
    [storageKey]
  );

  return { photos, setPhoto, prune };
}

/** The photo to display for an item: the override if one exists (''), otherwise the item's own. */
export function resolvePhoto(overrides: Record<string, string>, id: string, own?: string | null): string | undefined {
  if (id in overrides) return overrides[id] || undefined;
  return own || undefined;
}
