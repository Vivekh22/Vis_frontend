/**
 * SessionStore.ts — platform/state/
 *
 * Purpose:
 *   Concrete Store for impersonation session state. The ImpersonationBanner
 *   component subscribes to this to show / hide the persistent amber banner
 *   across Client, Admin, and Super Admin layouts.
 *
 * Type-level constraint — only Client accounts can be impersonated:
 *   impersonatedEntityType is a literal union whose ONLY non-null value is
 *   'client'. A future developer cannot write code that impersonates an Admin
 *   account — the type itself forbids it. This encodes the spec rule directly
 *   in the type system, not just in runtime checks.
 *
 * actingAsUserId + actingAsRole:
 *   The true, underlying Admin / Super Admin identity. Always preserved and
 *   available for logging, even during an impersonation session. actingAsRole
 *   distinguishes whether the acting user is an Admin or a Super Admin — the
 *   amber banner text differs per the locked specs:
 *     - Super Admin: "Viewing as [Client Name] — Super Admin session · Exit"
 *     - Admin:      "Viewing as [Client Name] — Admin session · Exit"
 *   Without actingAsRole, the banner cannot render the correct wording.
 *
 * clearSession() vs endImpersonation():
 *   endImpersonation() ends the impersonation but PRESERVES actingAsUserId and
 *   actingAsRole for audit logging (the true identity remains recoverable).
 *   clearSession() is the FULL reset — every field nulled — called by
 *   AuthStore.logout() so a stale impersonation banner or actingAsUserId cannot
 *   persist into a new login. This is the same "auth state and token storage
 *   must never drift out of sync" principle, extended to session state: auth,
 *   token, AND impersonation state are cleared together on logout.
 */
import { Store } from './Store';

export interface SessionState {
  isImpersonating: boolean;
  impersonatedEntityName: string | null;
  /** Only 'client' is permitted — never 'admin'. Null when not impersonating. */
  impersonatedEntityType: 'client' | null;
  /** The true underlying Admin / Super Admin identity — always preserved. */
  actingAsUserId: string | null;
  /** Whether the acting user is an Admin or Super Admin — drives banner text. */
  actingAsRole: 'admin' | 'super-admin' | null;
  sessionStartedAt: Date | null;
}

const INITIAL_SESSION_STATE: SessionState = {
  isImpersonating: false,
  impersonatedEntityName: null,
  impersonatedEntityType: null,
  actingAsUserId: null,
  actingAsRole: null,
  sessionStartedAt: null,
};

class SessionStoreImpl {
  private readonly store: Store<SessionState> = new Store<SessionState>(INITIAL_SESSION_STATE);

  public getState(): SessionState {
    return this.store.getState();
  }

  public subscribe(callback: (newState: SessionState, previousState: SessionState) => void): () => void {
    return this.store.subscribe(callback);
  }

  /**
   * Begins an impersonation session. entityType is constrained to 'client' by
   * the type system — Admin impersonation is impossible by construction.
   * actingAsRole records whether the acting user is an Admin or Super Admin,
   * which the ImpersonationBannerElement needs to render the correct wording.
   */
  public startImpersonation(params: {
    entityName: string;
    actingAsUserId: string;
    actingAsRole: 'admin' | 'super-admin';
  }): void {
    this.store.setState({
      isImpersonating: true,
      impersonatedEntityName: params.entityName,
      impersonatedEntityType: 'client',
      actingAsUserId: params.actingAsUserId,
      actingAsRole: params.actingAsRole,
      sessionStartedAt: new Date(),
    });
  }

  /**
   * Ends the impersonation session. actingAsUserId and actingAsRole are
   * preserved for audit logging — the true identity must always remain
   * recoverable even after the session ends. The banner hides because
   * isImpersonating is false.
   */
  public endImpersonation(): void {
    const current = this.store.getState();
    this.store.setState({
      isImpersonating: false,
      impersonatedEntityName: null,
      impersonatedEntityType: null,
      actingAsUserId: current.actingAsUserId,
      actingAsRole: current.actingAsRole,
      sessionStartedAt: null,
    });
  }

  /**
   * FULL reset — every field nulled. Called by AuthStore.logout() so a stale
   * impersonation banner or actingAsUserId cannot persist into a new login.
   * Distinct from endImpersonation(), which preserves the audit trail.
   */
  public clearSession(): void {
    this.store.setState(INITIAL_SESSION_STATE);
  }
}

export const sessionStore = new SessionStoreImpl();
