import { Component, Injector, afterNextRender, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';
import { GlobalSearchComponent } from './shared/components/global-search/global-search';
import { AuthService, Role, ROLE_LABELS, ROLES } from './core/services/auth.service';
import { AppConstants } from './utils/constants';

/** Path of a router URL without query string or fragment. */
const pathOf = (url: string) => url.split(/[?#]/)[0];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatIconModule, GlobalSearchComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  protected readonly authService = inject(AuthService);
  protected readonly roles = ROLES;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly urls = AppConstants.AppUrls;

  constructor() {
    // A page change would drop focus to <body>; move it to the new page's heading instead, so
    // keyboard and screen-reader users continue from there. Skipped on first load and on
    // query-only changes (typing in the search box, switching role on the same page).
    let lastPath: string | null = null;
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const path = pathOf(e.urlAfterRedirects);
        if (lastPath !== null && lastPath !== path) {
          afterNextRender(() => this.focusPage(), { injector: this.injector });
        }
        lastPath = path;
      });
  }

  protected changeRole(role: Role): void {
    if (role === this.authService.role()) return;
    this.authService.setRole(role);
    // On the access-denied page, retry the page that was blocked (roleGuard decides again).
    // Elsewhere, re-run the guard for the current page (e.g. demoted to Viewer while on details).
    const url = this.router.url;
    const from = this.router.parseUrl(url).queryParams['from'];
    const target = pathOf(url) === this.urls.RESTRICTED && from ? from : url;
    this.router.navigateByUrl(target, { onSameUrlNavigation: 'reload' });
  }

  /** Focuses the new page's <h1> (or <main>), unless the page already placed focus itself. */
  private focusPage(): void {
    const main = document.getElementById('main');
    const active = document.activeElement;
    if (!main || (active && active !== main && main.contains(active))) return;

    const target = main.querySelector<HTMLElement>('h1') ?? main;
    // tabindex="-1" makes it focusable by script without adding it to the Tab order.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
}
