import { Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { AppConstants } from '../../utils/constants';

@Component({
  selector: 'app-restricted',
  imports: [RouterLink, MatIconModule],
  templateUrl: './restricted.component.html',
  styleUrl: './restricted.component.scss',
})
/**
 * Access-denied (403) page. roleGuard redirects here when the current role may not open a route,
 * passing the blocked URL and the roles it needs, so the page can explain what was blocked and why.
 */
export class RestrictedComponent {
  private readonly router = inject(Router);
  protected readonly authService = inject(AuthService);
  /** Route paths used by the template's router links. */
  protected readonly urls = AppConstants.AppUrls;

  // Query params set by roleGuard, bound via withComponentInputBinding, e.g. '/restricted?from=/characters/42'.
  /** The URL that was blocked. */
  readonly from = input<string | undefined>();

  /**
   * Roles are simulated, so the reviewer can switch and go straight to what was blocked.
   * Falls back to the character list when the page was opened directly (no `from`),
   * and verifies `from` is a safe relative path to prevent unexpected navigation or open redirects.
   */
  protected switchToAdmin(): void {
    this.authService.setRole('admin');
    const target = this.from();
    const isSafeRelativeUrl = target?.startsWith('/') && !target.startsWith('//');
    this.router.navigateByUrl(isSafeRelativeUrl ? target! : this.urls.CHARACTERS);
  }
}
