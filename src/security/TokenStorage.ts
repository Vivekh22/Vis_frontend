/**
 * TokenStorage.ts — security/
 *
 * Purpose:
 *   The single, audited location for auth-token handling. Auth tokens are NEVER
 *   stored in raw localStorage / sessionStorage — those stores are readable by
 *   any injected script (XSS exfiltration risk) and persist across sessions.
 *
 * Design — httpOnly-cookie-first:
 *   In production, auth tokens MUST live in an httpOnly, Secure,
 *   SameSite=Strict cookie set by the backend. The browser attaches it to every
 *   same-origin request automatically; client-side JS cannot read it, so a
 *   successful XSS cannot exfiltrate it. This file does NOT set httpOnly
 *   cookies — a client cannot (only the server can). It documents the contract.
 *
 * Client-accessible token (standalone / mock mode only):
 *   This app runs standalone against a mock backend (no real server to issue an
 *   httpOnly cookie). To keep the mock usable, a token is held IN MEMORY ONLY
 *   (a module-private variable) for the duration of the session. In-memory
 *   storage is not persisted and is not accessible across tabs — it is the
 *   least-bad client-accessible option and is clearly isolated here. When a
 *   real backend exists, this in-memory path is unused: the httpOnly cookie
 *   carries the token and ApiClient relies on the browser sending it
 *   automatically.
 *
 * Coupling with AuthStore:
 *   AuthStore.logout() calls TokenStorage.clear() so auth state and token
 *   storage never drift out of sync. This coupling is intentional and enforced
 *   in logout(), not left to each caller.
 */

class TokenStorageImpl {
  /** In-memory token — never persisted to localStorage/sessionStorage. */
  private inMemoryToken: string | null = null;

  /**
   * Stores a token in memory (mock / standalone mode only).
   * In production the backend sets the httpOnly cookie; this is not called.
   */
  public setToken(token: string): void {
    this.inMemoryToken = token;
  }

  /** Returns the in-memory token, or null. Used by ApiClient in mock mode. */
  public getToken(): string | null {
    return this.inMemoryToken;
  }

  /** Clears the in-memory token. Called by AuthStore.logout(). */
  public clear(): void {
    this.inMemoryToken = null;
  }
}

export const TokenStorage = new TokenStorageImpl();