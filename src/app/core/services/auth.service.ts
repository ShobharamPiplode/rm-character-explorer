import { Service, computed, signal } from '@angular/core';
import { readSessionValue, writeSessionValue } from '../../utils/app.utils';
import { AppConstants } from '../../utils/constants';

export type Role = 'admin' | 'viewer';
export const ROLE_LABELS: Record<Role, string> = { admin: 'Admin', viewer: 'Viewer' };
export const ROLES = Object.keys(ROLE_LABELS) as Role[];

const STORAGE_KEY = AppConstants.SessionStorageKeys.ROLE_STORAGE_KEY;

/** Simulated role (no real authentication): starts as Admin, kept in sessionStorage. */
@Service()
export class AuthService {
  private readonly _role = signal<Role>(readSessionValue(STORAGE_KEY, ROLES) ?? 'admin');
  readonly role = this._role.asReadonly();
  readonly isAdmin = computed(() => this._role() === 'admin');

  public setRole(role: Role): void {
    this._role.set(role);
    writeSessionValue(STORAGE_KEY, role);
  }
}
