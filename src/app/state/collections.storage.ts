import { InjectionToken, isDevMode } from '@angular/core';
import type { Collection } from '../core/tmdb.models';

export const STORAGE = new InjectionToken<Storage>('STORAGE', {
  providedIn: 'root',
  factory: () => globalThis.localStorage,
});

export const COLLECTIONS_STORAGE_KEY = 'movie-collections';

export function readCollections(storage: Storage): readonly Collection[] {
  try {
    const raw = storage.getItem(COLLECTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Collection[]) : [];
  } catch {
    if (isDevMode()) {
      console.warn('Failed to read persisted collections from storage.');
    }
    return [];
  }
}

export function writeCollections(storage: Storage, collections: readonly Collection[]): void {
  try {
    storage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
  } catch {
    if (isDevMode()) {
      console.warn('Failed to persist collections to storage.');
    }
  }
}
