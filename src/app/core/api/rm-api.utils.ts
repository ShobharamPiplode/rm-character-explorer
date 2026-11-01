import { HttpErrorResponse } from '@angular/common/http';
import { Episode } from '../models/episode.model';

/** Pure helpers for Rick & Morty API responses; requests themselves go through RmApiService. */

/** Extracts numeric ids from episode resource URLs (".../api/episode/28" -> 28), resilient to trailing slashes. */
export function episodeIdsFromUrls(urls: readonly string[]): number[] {
  return urls
    .map((url) => {
      const match = url.match(/\/(\d+)\/?$/);
      return match ? Number(match[1]) : 0;
    })
    .filter((id) => id > 0);
}

/** The multi-id endpoint returns an object (not an array) when only one id is requested. */
export function normalizeEpisodes(response: Episode | Episode[] | undefined): Episode[] {
  if (!response) return [];
  return Array.isArray(response) ? response : [response];
}

/** Client-side, case-insensitive free-text filter on episode name. */
export function filterEpisodesByName(episodes: readonly Episode[], term: string): Episode[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return [...episodes];
  return episodes.filter((e) => e.name.toLowerCase().includes(needle));
}

/** The API answers a search with no matches with HTTP 404 — that is "empty", not a failure. */
export function isNotFound(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404;
}
