import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RmApiService } from '../../core/services/rm-api.service';
import { StateService } from '../../core/services/state.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { AppConstants } from '../../utils/constants';
import { isNotFound } from '../../core/api/rm-api.utils';

/** Number of episodes shown per page in the episode table. */
const EPISODES_PER_PAGE = 10;

@Component({
  selector: 'app-character-details',
  imports: [RouterLink, MatIconModule, MatProgressBarModule, StatusBadgeComponent, AvatarComponent],
  templateUrl: './character-details.component.html',
  styleUrl: './character-details.component.scss',
})
/**
 * Details page for a single character: profile info plus a filterable, paginated
 * list of the episodes they appear in.
 */
export class CharacterDetailsComponent {
  protected readonly stateService = inject(StateService);
  private readonly rmApiService = inject(RmApiService);

  /** Route paths used by the template's router links. */
  protected readonly urls = AppConstants.AppUrls;

  /** Bound from the `:id` route param; 0 when it is not a positive integer (e.g. '/characters/abc'). */
  readonly id = input.required({
    transform: (v: unknown) => {
      const id = numberAttribute(v, 0);
      return Number.isInteger(id) && id > 0 ? id : 0;
    },
  });

  /** Fetches the character; re-fetches whenever the route `id` changes. */
  protected readonly character = this.rmApiService.character(this.id);

  /** One request for all of the character's episodes: /episode/1,2,3 */
  protected readonly episodes = this.rmApiService.episodesOf(this.character);

  /** Episode name filter typed by the user; reset when the route opens another character. */
  protected readonly filter = linkedSignal({ source: this.id, computation: () => '' });

  /** Episodes as an array (the API returns a single object when there is only one). */
  protected readonly allEpisodes = computed(() =>
    this.episodes.hasValue() ? [this.episodes.value()].flat() : [],
  );
  /** Episodes whose name contains the filter (case-insensitive), before pagination. */
  protected readonly visibleEpisodes = computed(() => {
    const needle = this.filter().trim().toLowerCase();
    return this.allEpisodes().filter((e) => e.name.toLowerCase().includes(needle));
  });
  /** Zero-based episode page; back to the first page whenever the filtered list changes. */
  protected readonly pageIndex = linkedSignal({ source: this.visibleEpisodes, computation: () => 0 });
  /** Number of pages needed for the filtered episodes. */
  protected readonly pageCount = computed(() =>
    Math.ceil(this.visibleEpisodes().length / EPISODES_PER_PAGE),
  );
  /** Episodes on the current page. */
  protected readonly pagedEpisodes = computed(() => {
    const start = this.pageIndex() * EPISODES_PER_PAGE;
    return this.visibleEpisodes().slice(start, start + EPISODES_PER_PAGE);
  });
  /** Pager text, e.g. "11–20 of 51". */
  protected readonly rangeLabel = computed(() => {
    const total = this.visibleEpisodes().length;
    const start = this.pageIndex() * EPISODES_PER_PAGE;
    return `${start + 1}–${Math.min(start + EPISODES_PER_PAGE, total)} of ${total}`;
  });
  /** True for an invalid id, or when the API returns 404 for it (shows the "not found" state). */
  protected readonly characterNotFound = computed(
    () => this.id() === 0 || isNotFound(this.character.error()),
  );

  constructor() {
    // Keep the list's "selected" highlight in sync even when arriving by deep link.
    effect(() => {
      if (this.id() > 0) {
        this.stateService.selectedCharacterId.set(this.id());
      }
    });
  }

  /** The pager buttons use aria-disabled (so they keep focus), so clamp here instead. */
  protected goToPage(index: number): void {
    if (index >= 0 && index < this.pageCount()) {
      this.pageIndex.set(index);
    }
  }

  /** Applies the typed filter (paging resets via `pageIndex`). */
  protected onFilter(event: Event): void {
    this.filter.set((event.target as HTMLInputElement).value);
  }

  /** Clears the filter and returns focus to its input. */
  protected clearFilter(input: HTMLInputElement): void {
    this.filter.set('');
    input.focus();
  }
}
