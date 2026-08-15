/**
 * AuthStore.ts — platform/state/
 *
 * Purpose:
 *   Concrete Store instance for authentication state: current user, auth flag,
 *   and role. Wraps the generic Store<T> with convenience methods login() and
 *   logout().
 *
 * Invariant — auth state and token storage never drift:
 *   logout() resets auth state AND clears tokens via security/TokenStorage.
 *   Auth state and token storage MUST stay in sync — clearing one without the
 *   other would either leave a logged-out user holding a valid token or a
 *   logged-in user with no token. This coupling is intentional and enforced
 *   here, not left to each caller.
 *
 * login() does NOT manage tokens:
 *   Token issuance is the backend's responsibility (an httpOnly cookie in
 *   production). login() only updates client auth state. Callers pair login()
 *   with TokenStorage.setToken() in mock mode only.
 */
import { Store } from './Store';
import { TokenStorage } from '../../security/TokenStorage';
import { sessionStore } from './SessionStore';
import type { User, UserRole } from '../types';

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
}

const INITIAL_AUTH_STATE: AuthState = {
  currentUser: null,
  isAuthenticated: false,
  role: null,
};

class AuthStoreImpl {
  private readonly store: Store<AuthState> = new Store<AuthState>(INITIAL_AUTH_STATE);

  public getState(): AuthState {
    return this.store.getState();
  }

  public subscribe(callback: (newState: AuthState, previousState: AuthState) => void): () => void {
    return this.store.subscribe(callback);
  }

  /**
   * Sets the authenticated user. Updates auth state only — does NOT manage
   * tokens. Pair with TokenStorage.setToken() in mock mode.
   */
  public login(user: User): void {
    this.store.setState({
      currentUser: user,
      isAuthenticated: true,
      role: user.role,
    });
  }

  /**
   * Resets to unauthenticated AND clears tokens via TokenStorage.
   * Auth state and token storage are cleared together — never one without the
   * other.
   */
  /**
   * Resets to unauthenticated AND clears tokens via TokenStorage AND clears
   * any active impersonation session via sessionStore.clearSession(). Auth
   * state, token storage, and impersonation state are cleared together —
   * never one without the others — so a stale impersonation banner or
   * actingAsUserId cannot persist into a new login.
   */
  public logout(): void {
    TokenStorage.clear();
    sessionStore.clearSession();
    this.store.setState(INITIAL_AUTH_STATE);
  }
}

export const authStore = new AuthStoreImpl();