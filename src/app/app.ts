import { Component, Injector, afterNextRender, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter } from 'rxjs';
import { GlobalSearchComponent } from './shared/components/global-search/global-search';
import { AuthService, Role, ROLE_LABELS, ROLES } from './core/services/auth.service';
import { AppConstants } from './utils/constants';

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
  protected readonly roles: readonly Role[] = ROLES;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly urls = AppConstants.AppUrls;

  constructor() {
    // Page changes replace the content (and usually the link that was clicked), which would
    // drop focus to <body> silently. Move it to the new page's heading instead, so keyboard
    // users continue from there and screen readers announce where they landed.
    let lastPath: string | null = null;
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => {
        const path = e.urlAfterRedirects.split(/[?#]/)[0];
        const previous = lastPath;
        lastPath = path;
        // Leave focus alone on first load, and on query-only changes (typing in the search box,
        // switching role on the same page).
        if (previous === null || previous === path) return;
        afterNextRender(() => this.focusPage(), { injector: this.injector });
      });
  }

  protected changeRole(role: Role): void {
    if (role === this.authService.role()) return;
    this.authService.setRole(role);
    // On the access-denied page, retry the page that was blocked (roleGuard decides again).
    // Elsewhere, re-evaluate guards for the current page (e.g. demoted to Viewer while on details).
    const current = this.router.parseUrl(this.router.url);
    const onRestricted = this.router.url.split(/[?#]/)[0] === this.urls.RESTRICTED;
    const from: string | undefined = current.queryParams['from'];
    this.router.navigateByUrl(onRestricted && from ? from : this.router.url, {
      onSameUrlNavigation: 'reload',
    });
  }

  /**
   * Moves focus to the new page's main heading after a route change. Called via
   * afterNextRender (see the constructor), so the new page's DOM is already in place.
   */
  private focusPage(): void {
    const main = document.getElementById('main');
    if (!main) return;

    // The page may already have placed focus itself (e.g. back on the selected card).
    const active = document.activeElement;
    if (active && active !== main && main.contains(active)) return;

    // Fall back to the <main> landmark for pages without an <h1>.
    const target = main.querySelector<HTMLElement>('h1') ?? main;
    // Headings and <main> aren't focusable by default. tabindex="-1" lets script focus them
    // without adding them to the Tab order.
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
    }
    // Keep the router's scroll restoration.
    target.focus({ preventScroll: true });
  }
}
