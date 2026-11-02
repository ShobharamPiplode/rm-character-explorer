import { Service } from '@angular/core';
import { HttpResourceRef, httpResource } from '@angular/common/http';
import { ApiResponse, Character } from '../models/character.model';
import { Episode } from '../models/episode.model';
import { episodeIdsFromUrls } from '../api/rm-api.utils';

const API_BASE = 'https://rickandmortyapi.com/api';

/** A character-list page request, tied to the search term it was made for. */
export interface CharacterPageRequest {
  name: string;
  page: number;
}

/**
 * Rick & Morty API as `httpResource()`s: each re-fetches when its input signals change (cancelling
 * stale requests) and stays idle while the URL is undefined. Call from a component field
 * initializer, so the resource is destroyed with the component.
 */
@Service()
export class RmApiService {
  /** GET /character?name=…&page=… */
  public characterList(request: () => CharacterPageRequest | null) {
    return httpResource<ApiResponse<Character>>(() => {
      const req = request();
      return req
        ? { url: `${API_BASE}/character`, params: { name: req.name.trim(), page: req.page } }
        : undefined;
    });
  }

  /** GET /character/{id} */
  public character(id: () => number) {
    return httpResource<Character>(() => (id() > 0 ? `${API_BASE}/character/${id()}` : undefined));
  }

  /** GET /episode/1,2,3: all of the character's episodes in one request (an object if only one). */
  public episodesOf(character: HttpResourceRef<Character | undefined>) {
    return httpResource<Episode | Episode[]>(() => {
      const ids = character.hasValue() ? episodeIdsFromUrls(character.value().episode) : [];
      return ids.length ? `${API_BASE}/episode/${ids.join(',')}` : undefined;
    });
  }
}
