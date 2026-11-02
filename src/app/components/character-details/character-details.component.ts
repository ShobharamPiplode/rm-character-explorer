import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  numberAttribute,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RmApiService } from '../../core/services/rm-api.service';
import { StateService } from '../../core/services/state.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge';
import { pageTitle } from '../../utils/app.utils';
import { AppConstants } from '../../utils/constants';
import { normalizeEpisodes, filterEpisodesByName, isNotFound } from '../../core/api/rm-api.utils';

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
  /** Zero-based index of the current episode page; reset when the route opens another character. */
  protected readonly pageIndex = linkedSignal({ source: this.id, computation: () => 0 });

  /** Episodes as an array (the API returns a single object when there is only one). */
  protected readonly allEpisodes = computed(() =>
    this.episodes.hasValue() ? normalizeEpisodes(this.episodes.value()) : [],
  );
  /** Episodes matching the filter, before pagination. */
  protected readonly visibleEpisodes = computed(() =>
    filterEpisodesByName(this.allEpisodes(), this.filter()),
  );
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

    // Name the page after the character once it is known (the route title is generic).
    const title = inject(Title);
    effect(() => {
      if (this.character.hasValue()) {
        title.setTitle(pageTitle(this.character.value().name));
      } else if (this.characterNotFound()) {
        title.setTitle(pageTitle('Character not found'));
      }
    });
  }

  /** The pager buttons use aria-disabled (so they keep focus), so clamp here instead. */
  protected goToPage(index: number): void {
    if (index >= 0 && index < this.pageCount()) {
      this.pageIndex.set(index);
    }
  }

  /** Applies the typed filter and jumps back to the first page. */
  protected onFilter(event: Event): void {
    this.filter.set((event.target as HTMLInputElement).value);
    this.pageIndex.set(0);
  }

  /** Clears the filter input, resets paging and returns focus to the input. */
  protected clearFilter(input: HTMLInputElement): void {
    input.value = '';
    this.filter.set('');
    this.pageIndex.set(0);
    input.focus();
  }
}
