import {
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CharacterPageRequest, RmApiService } from '../../core/services/rm-api.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { AuthService } from '../../core/services/auth.service';
import { StateService } from '../../core/services/state.service';
import { Character, ViewMode } from '../../core/models/character.model';
import { isNotFound } from '../../core/api/rm-api.utils';
import { AppConstants } from '../../utils/constants';

@Component({
  selector: 'app-character-list',
  imports: [RouterLink, MatIconModule, MatProgressBarModule, StatusBadgeComponent, AvatarComponent],
  templateUrl: './character-list.component.html',
  styleUrl: './character-list.component.scss',
})
/**
 * Searchable, infinitely scrolling list of characters (grid or list view).
 * Loaded pages are kept in `StateService.listCache` so returning from the details page
 * restores the results and scroll position without re-fetching.
 */
export class CharacterListComponent {
  protected readonly authService = inject(AuthService);
  protected readonly stateService = inject(StateService);
  private readonly rmApiService = inject(RmApiService);

  /** Route paths used by the template's router links. */
  protected readonly urls = AppConstants.AppUrls;

  /** Bound from `?name=` via withComponentInputBinding. */
  readonly name = input('', { transform: (v: string | undefined) => v ?? '' });

  /**
   * The next API page to fetch; null when nothing needs fetching (e.g. restored from cache).
   * Tied to the search term it was made for, so a stale page is never appended.
   */
  private readonly request = signal<CharacterPageRequest | null>(null);

  /** Re-fetches whenever the request changes; stale requests are cancelled automatically. */
  protected readonly characters = this.rmApiService.characterList(this.request);

  /** Empty element after the last card; scrolling it into view triggers the next page. */
  private readonly sentinel = viewChild<ElementRef<HTMLElement>>('sentinel');

  /** Cached results, but only if they belong to the current search term. */
  private readonly cache = computed(() => {
    const cache = this.stateService.listCache();
    return cache?.name === this.name() ? cache : null;
  });
  // Derived views of the cache for the template.
  protected readonly results = computed(() => this.cache()?.results ?? []);
  protected readonly total = computed(() => this.cache()?.count ?? 0);
  protected readonly loadedPages = computed(() => this.cache()?.pages ?? 0);
  protected readonly totalPages = computed(() => this.cache()?.totalPages ?? 0);
  /** True while there are API pages left to fetch. */
  protected readonly hasMore = computed(() => this.loadedPages() < this.totalPages());

  /** True while a page request is in flight. */
  protected readonly loading = this.characters.isLoading;
  /** The API answers 404 when a search has no results; treat that as "no matches", not an error. */
  protected readonly noMatches = computed(
    () => isNotFound(this.characters.error()) && this.results().length === 0,
  );
  /** Any other request error (network, server). */
  protected readonly failed = computed(
    () => !!this.characters.error() && !isNotFound(this.characters.error()),
  );
  /** Loading with nothing to show yet: the template shows the loading state instead of the list. */
  protected readonly firstLoad = computed(() => this.loading() && this.results().length === 0);

  /** Loading / no matches / error message, or null when there are results to describe. */
  private readonly stateMessage = computed(() => {
    if (this.firstLoad()) return 'Loading characters…';
    if (this.noMatches()) return `No characters match “${this.name()}”`;
    if (this.failed() && !this.results().length) return 'Could not load characters';
    return null;
  });
  /** e.g. "826 characters" or "107 results for “rick”". */
  private readonly countText = computed(() => {
    const count = this.total().toLocaleString();
    return this.name() ? `${count} results for “${this.name()}”` : `${count} characters`;
  });
  /** Visible status line above the list. */
  protected readonly summary = computed(
    () => this.stateMessage() ?? `${this.countText()} · showing ${this.results().length}`,
  );
  /** Live-region text: unlike `summary`, it stays the same while further pages are appended. */
  protected readonly announcement = computed(
    () => this.stateMessage() ?? (this.results().length ? this.countText() : ''),
  );

  constructor() {
    // New search term -> start over at page 1, unless we already hold results for it
    // (coming back from the details page), in which case nothing is re-fetched. A cache with no
    // pages (first page failed or found no matches) is refetched, so its message/Retry come back.
    effect(() => {
      const name = this.name(); // tracked: the only trigger
      untracked(() => {
        const cache = this.stateService.listCache(); // not tracked
        if (cache?.name === name && cache.pages > 0) {
          this.request.set(null);
          return;
        }
        // writes the same signal value on every name change, but that's a no-op for the signal and the API request.
        this.stateService.listCache.set({ name, pages: 0, totalPages: 0, count: 0, results: [] });
        this.request.set({ name, page: 1 });
      });
    });

    // Append each page as it arrives, deduplicating to avoid duplicate key issues in @for.
    effect(() => {
      if (!this.characters.hasValue()) return;
      const page = this.characters.value(); // tracked: a new page arrived
      untracked(() => {
        const req = this.request(); // not tracked
        const cache = this.stateService.listCache(); // not tracked
        if (!req || !cache || cache.name !== req.name || req.page !== cache.pages + 1) return;
        const existingIds = new Set(cache.results.map((c) => c.id));
        const newResults = page.results.filter((c) => !existingIds.has(c.id));
        this.stateService.listCache.set({
          name: cache.name,
          pages: req.page,
          totalPages: page.info.pages,
          count: page.info.count,
          results: [...cache.results, ...newResults],
        });
      });
    });

    // Remember the search so "Back" on the details page returns to it.
    effect(() => this.stateService.lastListParams.set({ name: this.name() || undefined }));

    // Infinite scroll: fetch the next page when the sentinel below the list comes into view.
    // The observer only reports visibility changes, so it is recreated after every appended page:
    // its initial callback then loads the next page if the sentinel is still on screen.
    effect((onCleanup) => {
      this.loadedPages();
      const el = this.sentinel()?.nativeElement;
      if (!this.hasMore() || !el || typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver(
        (entries) => entries.some((e) => e.isIntersecting) && this.loadMore(),
        { rootMargin: '400px 0px' },
      );
      observer.observe(el);
      onCleanup(() => observer.disconnect());
    });

    // When returning from details, bring the previously selected character into view.
    let restored = false;
    afterRenderEffect(() => {
      const id = this.stateService.selectedCharacterId();
      if (restored || id == null || !this.results().length) return;
      restored = true;
      const item = document.getElementById(`character-${id}`);
      item?.scrollIntoView({ block: 'center' });
      // Put keyboard focus back on the card the user opened, unless they are busy elsewhere
      // (e.g. typing in the header search, which also lands here).
      const active = document.activeElement;
      if (!active || active === document.body || document.getElementById('main')?.contains(active)) {
        item?.querySelector('a')?.focus({ preventScroll: true });
      }
    });
  }

  /** Same accessible name in grid and list view: everything the card shows, plus access. */
  protected linkLabel(character: Character): string {
    const access = this.authService.isAdmin() ? 'view details' : 'details restricted to Admin';
    return `${character.name}, ${character.status}, ${character.species}, ${character.gender}, ${character.episode.length} episodes, ${access}`;
  }

  /** Switches between grid and list layout; the choice is kept in StateService. */
  protected setView(mode: ViewMode): void {
    this.stateService.viewMode.set(mode);
  }

  /** Remembers the opened character so the list can highlight and scroll back to it. */
  protected selectCharacter(character: Character): void {
    this.stateService.selectedCharacterId.set(character.id);
  }

  /** Requests the next page, unless one is already loading, none are left, or the last request failed. */
  protected loadMore(): void {
    if (this.loading() || !this.hasMore() || this.failed()) return;
    this.request.set({ name: this.name(), page: this.loadedPages() + 1 });
  }

  /** Retries after an error: reloads the failed request, or requests the next page if none is pending. */
  protected retry(): void {
    if (this.request()) this.characters.reload();
    else this.request.set({ name: this.name(), page: this.loadedPages() + 1 });
  }
}
