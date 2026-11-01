import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from '../services/auth.service';
import { AppConstants } from '../../utils/constants';

/**
 * Functional guard: allows navigation when the current role is listed in `route.data.roles`,
 * otherwise redirects to the restricted page carrying the attempted URL so the page can explain
 * exactly what was blocked and why.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowed = (route.data['roles'] as Role[] | undefined) ?? [];

  if (allowed.length === 0 || authService.hasAnyRole(allowed)) return true;

  return router.createUrlTree([AppConstants.AppUrls.RESTRICTED], {
    queryParams: { from: state.url, required: allowed.join(',') },
  });
};
