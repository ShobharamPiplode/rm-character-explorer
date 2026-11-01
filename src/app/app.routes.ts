import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/services/auth.service';
import { AppConstants } from './utils/constants';

const { AppUrls } = AppConstants;

/** Route paths are the app URLs without the leading slash. e.g., '/characters' becomes 'characters' */
const path = (url: string) => url.slice(1);

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: path(AppUrls.CHARACTERS),
  },
  {
    path: path(AppUrls.CHARACTERS),
    title: 'All characters',
    canActivate: [roleGuard],
    data: { roles: ['admin', 'viewer'] satisfies Role[] },
    loadComponent: () =>
      import('./components/character-list/character-list.component').then(
        (m) => m.CharacterListComponent,
      ),
  },
  {
    path: path(AppUrls.CHARACTER_DETAILS),
    title: 'Character details',
    canActivate: [roleGuard],
    runGuardsAndResolvers: 'always',
    data: { roles: ['admin'] satisfies Role[] },
    loadComponent: () =>
      import('./components/character-details/character-details.component').then(
        (m) => m.CharacterDetailsComponent,
      ),
  },
  {
    path: path(AppUrls.RESTRICTED),
    title: 'Access denied',
    loadComponent: () =>
      import('./components/restricted/restricted.component').then((m) => m.RestrictedComponent),
  },
  {
    path: '**',
    title: 'Page not found',
    loadComponent: () =>
      import('./components/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
