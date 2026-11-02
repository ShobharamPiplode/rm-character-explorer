import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, Role } from '../services/auth.service';
import { AppConstants } from '../../utils/constants';

/** Allows the route if the current role is in `data.roles`; otherwise redirects to the access-denied page. */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles: Role[] = route.data['roles'] ?? [];
  if (allowedRoles.includes(authService.role())) return true;

  return router.createUrlTree([AppConstants.AppUrls.RESTRICTED], {
    queryParams: { from: state.url },
  });
};
