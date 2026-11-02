import { HttpErrorResponse } from '@angular/common/http';

/** Extracts numeric ids from episode resource URLs (".../api/episode/28" -> 28), resilient to trailing slashes. */
export function episodeIdsFromUrls(urls: readonly string[]): number[] {
  return urls
    .map((url) => {
      const match = url.match(/\/(\d+)\/?$/);
      return match ? Number(match[1]) : 0;
    })
    .filter((id) => id > 0);
}

/** The API answers a search with no matches with HTTP 404 — that is "empty", not a failure. */
export function isNotFound(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 404;
}
