import { Service, effect, signal } from '@angular/core';
import { Character, ViewMode } from '../models/character.model';
import { readSessionValue, writeSessionValue } from '../../utils/app.utils';
import { AppConstants } from '../../utils/constants';

/** Valid view modes; used to validate the value restored from sessionStorage. */
const VIEW_MODES: readonly ViewMode[] = ['grid', 'list'];

/** Characters loaded so far for one search term ("Load more" / infinite scroll appends pages). */
export interface CharacterListCache {
  name: string;
  pages: number;
  totalPages: number;
  count: number;
  results: Character[];
}

/** Query params of the list route (search term and page). */
export interface ListParams {
  name?: string;
  page?: number;
}

/**
 * UI state that must survive navigating list -> details -> list.
 *
 * Search term and page live in the URL (shareable, back-button friendly), and the list route
 * reads them as component inputs. This service keeps what does not belong in the URL:
 * the last list query params (for the in-app "Back" button), the characters loaded so far,
 * and the last selected character (highlighted and scrolled into view on return). The grid/list choice is a user preference,
 * so it is also persisted to sessionStorage and survives page refreshes.
 */
@Service()
export class StateService {
  /** Grid or list layout; restored from sessionStorage, defaults to grid. */
  readonly viewMode = signal<ViewMode>(
    readSessionValue(AppConstants.SessionStorageKeys.VIEW_MODE_STORAGE_KEY, VIEW_MODES) ?? 'grid',
  );
  /** Id of the last opened character, highlighted and scrolled into view when returning to the list. */
  readonly selectedCharacterId = signal<number | null>(null);
  /** Query params of the last visited list view (search term + page). */
  readonly lastListParams = signal<ListParams>({});
  /**
   * Everything loaded on the list so far. Kept here (not in the component) so returning from
   * details shows the same characters at the same scroll position instead of only page 1.
   */
  readonly listCache = signal<CharacterListCache | null>(null);

  /** Persists the view mode to sessionStorage whenever it changes. */
  constructor() {
    effect(() =>
      writeSessionValue(AppConstants.SessionStorageKeys.VIEW_MODE_STORAGE_KEY, this.viewMode()),
    );
  }
}
