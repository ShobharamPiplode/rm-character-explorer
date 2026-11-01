import { Service } from '@angular/core';
import { HttpResourceRef, httpResource } from '@angular/common/http';
import { ApiResponse, Character } from '../models/character.model';
import { Episode } from '../models/episode.model';
import { episodeIdsFromUrls } from '../api/rm-api.utils';

/** Base URL of the public Rick & Morty REST API. */
export const API_BASE = 'https://rickandmortyapi.com/api';

/** A character-list page request, tied to the search term it was made for. */
export interface CharacterPageRequest {
  name: string;
  page: number;
}

/**
 * Rick & Morty API access built on Angular's signal-based `httpResource()`.
 *
 * Each method creates a resource that re-issues its request whenever the signals feeding the
 * URL change, and cancels stale in-flight requests. Call them from a component field initializer:
 * the resource is created in the caller's injection context, so it is destroyed with the
 * component rather than living on in this root singleton.
 */
@Service()
export class RmApiService {
  /** GET /character?name={name}&page={number}; idle while `request` is null. */
  public characterList(
    request: () => CharacterPageRequest | null,
  ): HttpResourceRef<ApiResponse<Character> | undefined> {
    return httpResource<ApiResponse<Character>>(() => {
      const req = request();
      return req ? this.characterListUrl(req.name, req.page) : undefined;
    });
  }

  /** GET /character/{id} — used when the details route is opened directly (deep link / refresh). */
  public character(id: () => number): HttpResourceRef<Character | undefined> {
    return httpResource<Character>(() => (id() > 0 ? `${API_BASE}/character/${id()}` : undefined));
  }

  /**
   * GET /episode/{ids}. The API accepts a comma-separated id list (`/episode/1,2,3`), so every
   * episode of the character is fetched in ONE request instead of N.
   */
  public episodesOf(
    character: HttpResourceRef<Character | undefined>,
  ): HttpResourceRef<Episode | Episode[] | undefined> {
    return httpResource<Episode | Episode[]>(() =>
      character.hasValue()
        ? this.episodesUrl(episodeIdsFromUrls(character.value().episode))
        : undefined,
    );
  }

  /** Builds the character-list URL, omitting `name` when blank and `page` when it is the first page. */
  private characterListUrl(name: string, page: number): string {
    const params = new URLSearchParams();
    const trimmed = name.trim();
    if (trimmed) params.set('name', trimmed);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    return `${API_BASE}/character${qs ? `?${qs}` : ''}`;
  }

  /** Builds the multi-episode URL; returns undefined (resource stays idle) when there are no ids. */
  private episodesUrl(ids: readonly number[]): string | undefined {
    return ids.length ? `${API_BASE}/episode/${ids.join(',')}` : undefined;
  }
}
