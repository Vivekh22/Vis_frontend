/**
 * CsrfProtection.ts — security/
 *
 * Purpose:
 *   Implements the double-submit-cookie pattern for CSRF protection.
 *   State-changing requests (POST/PUT/PATCH/DELETE) must carry a CSRF token
 *   that the backend can verify matches the one in the httpOnly session cookie.
 *
 *   The token is read from a cookie named 'csrf_token' (set by the backend
 *   as a non-httpOnly cookie so client JS can read it). It is attached as
 *   the 'X-CSRF-Token' header on every state-changing request by ApiClient.
 *
 *   This is a standard, well-understood pattern: the backend sets two tokens
 *   — one in an httpOnly cookie (unreadable by JS) and one in a regular
 *   cookie readable by JS. On a state-changing request, the backend compares
 *   the header token to the httpOnly cookie token. An attacker cannot read
 *   the JS-readable cookie (same-origin policy), so they cannot forge the
 *   header, preventing CSRF.
 */
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

class CsrfProtectionImpl {
  /**
   * Reads the CSRF token from the csrf_token cookie. Returns null if the
   * cookie is not present (e.g. before the backend has set it, or in mock
   * mode where there is no backend).
   */
  public getToken(): string | null {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie;
    if (!cookies) return null;
    const match = cookies.split(';').map(c => c.trim()).find(c => c.startsWith(`${CSRF_COOKIE_NAME}=`));
    if (!match) return null;
    const value = match.substring(CSRF_COOKIE_NAME.length + 1);
    return decodeURIComponent(value);
  }

  public getHeaderName(): string {
    return CSRF_HEADER_NAME;
  }
}

export const CsrfProtection = new CsrfProtectionImpl();