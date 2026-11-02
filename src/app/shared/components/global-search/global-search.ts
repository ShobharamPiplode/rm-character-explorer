import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { AppConstants } from '../../../utils/constants';

/**
 * Header search box, kept in sync with the list's `?name=` query param: typing navigates to the
 * list (debounced), and navigating (back/forward, deep links, leaving the list) updates the box.
 */
@Component({
  selector: 'app-global-search',
  imports: [MatIconModule],
  template: `
    <label class="field">
      <span class="visually-hidden">Search characters by name</span>
      <mat-icon class="field-icon" aria-hidden="true">search</mat-icon>
      <input
        #searchInput
        type="search"
        [value]="searchTerm()"
        (input)="searchTerm.set($any($event.target).value)"
        placeholder="Search characters by name…"
        autocomplete="off"
      />
      @if (searchTerm()) {
        <button class="field-clear" type="button" aria-label="Clear search" (click)="clear(searchInput)">
          <mat-icon>close</mat-icon>
        </button>
      }
    </label>
  `,
  styles: `
    .field input {
      background: var(--rm-bg);
    }
  `,
})
export class GlobalSearchComponent {
  private readonly router = inject(Router);
  /** Raw input text, untrimmed, so the caret isn't disturbed while typing. */
  protected readonly searchTerm = signal('');

  constructor() {
    // Typing -> debounced navigation. Skipped when the URL already holds the term: the URL -> box
    // sync below also sets searchTerm (e.g. to '' when opening a details page), and that must not
    // navigate back to the list.
    toObservable(this.searchTerm)
      .pipe(
        map((v) => v.trim()),
        debounceTime(350),
        distinctUntilChanged(),
        filter((v) => v !== this.urlSearchTerm()),
        takeUntilDestroyed(),
      )
      .subscribe((name) => this.searchName(name));

    // URL change -> box. Compared trimmed so trailing spaces being typed aren't wiped out.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        const fromUrl = this.urlSearchTerm();
        if (fromUrl !== this.searchTerm().trim()) this.searchTerm.set(fromUrl);
      });
  }

  /** Empties the box and drops the `name` filter immediately, keeping focus in the field. */
  protected clear(input: HTMLInputElement): void {
    this.searchTerm.set('');
    this.searchName('');
    input.focus();
  }

  /** Navigates to the list; other query params (e.g. from '/restricted?from=…') aren't carried over. */
  private searchName(name: string): void {
    this.router.navigate([AppConstants.AppUrls.CHARACTERS], {
      queryParams: { name: name || undefined },
    });
  }

  /**
   * The `name` query param of the current URL, or '' when not on the characters list.
   *
   * This component lives in the header, outside the router outlet, so it has no
   * ActivatedRoute for the list page and reads the URL from the Router instead.
   * `router.url` is parsed into a UrlTree, and the primary outlet's segments are
   * joined back into a path without the query string or fragment, e.g.
   *   '/characters?name=rick&page=2'  -> path 'characters'     -> 'rick'
   *   '/characters/1?name=rick'       -> path 'characters/1'   -> '' (details page)
   *   '/'                             -> path undefined        -> '' (no primary child)
   */
  private urlSearchTerm(): string {
    const tree = this.router.parseUrl(this.router.url);
    const path = tree.root.children['primary']?.segments.map((s) => s.path).join('/');
    return `/${path}` === AppConstants.AppUrls.CHARACTERS ? (tree.queryParams['name'] ?? '') : '';
  }
}
