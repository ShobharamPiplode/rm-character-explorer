import { Service, effect, signal } from '@angular/core';
import { Character, ViewMode } from '../models/character.model';
import { readSessionValue, writeSessionValue } from '../../utils/app.utils';
import { AppConstants } from '../../utils/constants';

const STORAGE_KEY = AppConstants.SessionStorageKeys.VIEW_MODE_STORAGE_KEY;

/** Characters loaded so far for one search term. */
export interface CharacterListCache {
  name: string;
  pages: number;
  totalPages: number;
  count: number;
  results: Character[];
}

/** UI state that survives navigating list -> details -> list. */
@Service()
export class StateService {
  /** Grid or list layout, kept in sessionStorage. */
  readonly viewMode = signal<ViewMode>(readSessionValue(STORAGE_KEY, ['grid', 'list']) ?? 'grid');
  /** Last opened character, highlighted and scrolled into view back on the list. */
  readonly selectedCharacterId = signal<number | null>(null);
  /** Last list search, for the details page's "Back" link. */
  readonly lastListParams = signal<{ name?: string }>({});
  /** Loaded pages, so returning from details doesn't start again at page 1. */
  readonly listCache = signal<CharacterListCache | null>(null);

  constructor() {
    effect(() => writeSessionValue(STORAGE_KEY, this.viewMode()));
  }
}
