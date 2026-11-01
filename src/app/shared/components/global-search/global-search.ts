import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs';
import { AppConstants } from '../../../utils/constants';

/**
 * Header search box that keeps its text in sync with the `name` query param
 * of the characters list. Typing navigates to the list (debounced);
 * navigating (back/forward, deep links, leaving the list) updates the box.
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
        <button class="field-clear" type="button" aria-label="Clear search" (click)="clear()">
          <mat-icon>close</mat-icon>
        </button>
      }
    </label>
  `,
  styles: `
    :host {
      display: block;
    }
    .field input {
      background: var(--rm-bg);
    }
  `,
})
export class GlobalSearchComponent {
  private readonly router = inject(Router);
  /** Raw input text, untrimmed, so the caret isn't disturbed while typing. */
  protected readonly searchTerm = signal('');
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  constructor() {
    const destroyRef = inject(DestroyRef);

    // User typing -> debounced URL update.
    toObservable(this.searchTerm)
      .pipe(
        map((v) => v.trim()),
        debounceTime(350),
        distinctUntilChanged(),
        // Don't navigate when the URL already holds this term. searchTerm is also set by the
        // URL -> input sync below, and this stream can't tell that apart from typing. E.g.
        // opening '/characters/1' from '?name=rick' clears the box to ''; without this check
        // that '' would navigate back to '/characters' and pull the user off the details page.
        filter((v) => v !== this.urlSearchTerm()),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe((name) => this.searchName(name));

    // URL change (back/forward, deep link, leaving the list) -> input value.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(() => {
        const fromUrl = this.urlSearchTerm();
        // Compare trimmed so trailing spaces the user is still typing aren't wiped out.
        if (fromUrl !== this.searchTerm().trim()) {
          this.searchTerm.set(fromUrl);
        }
      });
  }

  /** Empties the box and drops the `name` filter immediately, skipping the debounce. */
  protected clear(): void {
    this.searchTerm.set('');
    this.searchName('');
    // The clear button disappears with the text; keep focus in the field rather than <body>.
    this.searchInput().nativeElement.focus();
  }

  /**
   * Navigates to the characters list with the given name filter. An empty name
   * removes the param. Other query params are deliberately not carried over, so
   * searching from e.g. '/restricted?from=…' doesn't leak them onto the list URL.
   */
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
