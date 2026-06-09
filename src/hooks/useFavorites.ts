import { useEffect, useState, useCallback } from "react";

const FAV_KEY = "jibda:favorites:v1";
const ONLY_KEY = "jibda:favoritesOnly:v1";

let favCache: Set<number> | null = null;
const favListeners = new Set<() => void>();

function loadFavorites(): Set<number> {
  if (favCache) return favCache;
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const arr = raw ? (JSON.parse(raw) as number[]) : [];
    favCache = new Set(arr);
  } catch {
    favCache = new Set();
  }
  return favCache;
}

function saveFavorites(next: Set<number>) {
  favCache = new Set(next);
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify([...favCache]));
  } catch {
    /* ignore */
  }
  favListeners.forEach((l) => l());
}

export function useFavorites() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    favListeners.add(l);
    return () => {
      favListeners.delete(l);
    };
  }, []);
  const favorites = loadFavorites();

  const toggleFavorite = useCallback((id: number) => {
    const next = new Set(loadFavorites());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    saveFavorites(next);
  }, []);

  const clearFavorites = useCallback(() => saveFavorites(new Set()), []);
  const setFavorites = useCallback((next: Set<number>) => saveFavorites(next), []);

  return { favorites, toggleFavorite, clearFavorites, setFavorites };
}

let onlyCache: boolean | null = null;
const onlyListeners = new Set<() => void>();

function loadOnly(): boolean {
  if (onlyCache !== null) return onlyCache;
  try {
    onlyCache = localStorage.getItem(ONLY_KEY) === "1";
  } catch {
    onlyCache = false;
  }
  return onlyCache;
}

export function useFavoritesOnly() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const l = () => setTick((t) => t + 1);
    onlyListeners.add(l);
    return () => {
      onlyListeners.delete(l);
    };
  }, []);

  const enabled = loadOnly();
  const toggle = useCallback(() => {
    onlyCache = !loadOnly();
    try {
      localStorage.setItem(ONLY_KEY, onlyCache ? "1" : "0");
    } catch {
      /* ignore */
    }
    onlyListeners.forEach((l) => l());
  }, []);

  return { enabled, toggle };
}
