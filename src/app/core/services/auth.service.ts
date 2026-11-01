import { Service, computed, signal } from '@angular/core';
import { readSessionValue, writeSessionValue } from '../../utils/app.utils';
import { AppConstants } from '../../utils/constants';

/** Roles a user can hold; checked by the role guard to authorize routes. */
export type Role = 'admin' | 'viewer';

/** Human-readable label for each role, shown in the toolbar. */
export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  viewer: 'Viewer',
};

/** All valid roles; also used to validate the value restored from sessionStorage. */
export const ROLES = Object.keys(ROLE_LABELS) as Role[];

/**
 * Hardcoded starting role (authentication is out of scope for the challenge).
 * A toolbar toggle lets reviewers switch roles to see the authorization rules in action.
 */
export const DEFAULT_ROLE: Role = 'admin';

/**
 * Holds the current user's role as a signal and answers authorization checks.
 *
 * The role is restored from sessionStorage on startup (falling back to `DEFAULT_ROLE`) and
 * written back on every change, so a role switch survives page refreshes.
 */
@Service()
export class AuthService {
  /** Writable source of truth; exposed publicly only as a read-only signal. */
  private readonly _role = signal<Role>(
    readSessionValue(AppConstants.SessionStorageKeys.ROLE_STORAGE_KEY, ROLES) ?? DEFAULT_ROLE,
  );

  /** Current role (read-only). */
  readonly role = this._role.asReadonly();
  /** Display label for the current role. */
  readonly roleLabel = computed(() => ROLE_LABELS[this._role()]);
  /** True when the current role is `admin`. */
  readonly isAdmin = computed(() => this._role() === 'admin');

  /** Switches the current role and persists it to sessionStorage. */
  public setRole(role: Role): void {
    this._role.set(role);
    writeSessionValue(AppConstants.SessionStorageKeys.ROLE_STORAGE_KEY, role);
  }

  /** Returns true if the current role is one of `allowed` (used by the route role guard). */
  public hasAnyRole(allowed: readonly Role[]): boolean {
    return allowed.includes(this._role());
  }
}
