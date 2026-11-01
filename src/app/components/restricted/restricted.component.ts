import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, ROLE_LABELS, Role } from '../../core/services/auth.service';
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

  // Query params set by roleGuard, bound via withComponentInputBinding, e.g. '/restricted?from=/characters/42&required=admin'.
  /** The URL that was blocked. */
  readonly from = input<string | undefined>();

  /**
   * Roles are simulated, so the reviewer can switch and go straight to what was blocked.
   * Falls back to the character list when the page was opened directly (no `from`).
   */
  protected switchToAdmin(): void {
    this.authService.setRole('admin');
    this.router.navigateByUrl(this.from() || AppConstants.AppUrls.CHARACTERS);
  }
}
