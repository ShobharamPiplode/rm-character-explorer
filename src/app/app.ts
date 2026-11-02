import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { GlobalSearchComponent } from './shared/components/global-search/global-search';
import { AuthService, Role, ROLE_LABELS, ROLES } from './core/services/auth.service';
import { AppConstants } from './utils/constants';

/** Path of a router URL without query string or fragment. URL: '/characters?name=rick' becomes '/characters' */
const pathOf = (url: string) => url.split(/[?#]/)[0];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatIconModule, GlobalSearchComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  protected readonly roles = ROLES;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly urls = AppConstants.AppUrls;

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
}
