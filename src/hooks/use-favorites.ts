"use client";

import { useCallback, useEffect, useState } from "react";

const getStorageKey = (storeSlug: string) => `sahla-favorites-${storeSlug}`;

export function getFavoritesFromStorage(storeSlug: string) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getStorageKey(storeSlug));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveFavoritesToStorage(storeSlug: string, favorites: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getStorageKey(storeSlug), JSON.stringify(favorites));
}

export function useFavorites(storeSlug: string) {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (!storeSlug) return;
    setFavorites(getFavoritesFromStorage(storeSlug));
  }, [storeSlug]);

  const toggleFavorite = useCallback(
    (productId: string) => {
      setFavorites((current) => {
        const next = current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId];
        saveFavoritesToStorage(storeSlug, next);
        return next;
      });
    },
    [storeSlug]
  );

  const isFavorite = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites]
  );

  return {
    favorites,
    isFavorite,
    toggleFavorite,
  };
}
