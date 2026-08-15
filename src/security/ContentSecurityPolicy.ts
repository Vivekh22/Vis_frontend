/**
 * ContentSecurityPolicy.ts — security/
 *
 * Purpose:
 *   Defines and applies the application's Content Security Policy (CSP).
 *   This is the TypeScript-defined, runtime-applied CSP — distinct from
 *   the baseline <meta> tag in index.html. The meta tag is a static
 *   fallback; this module provides the authoritative, programmatically-
 *   configured policy that covers all resource types relevant to the app.
 *
 *   The CSP is built from config/env.ts's API base URL so connect-src
 *   always matches the configured backend — no hardcoded URLs that drift
 *   when the environment changes.
 *
 * Policy coverage:
 *   - script-src: self only (no inline scripts, no eval, no external CDNs)
 *   - style-src: self + inline styles (Shadow DOM uses inline styles)
 *   - connect-src: self + the API base URL from config/env.ts
 *   - img-src: self + data: (for base64-encoded small images) + https: (for Unsplash stock photos)
 *   - frame-src: none (the HTML creative builder's sandboxed iframe from
 *       Part 9 is rendered in a sandbox attribute, not via frame-src —
 *       the CSP blocks all framing except what the sandbox attribute allows)
 *   - font-src: self (no external font CDNs)
 *   - object-src: none (no Flash/plugins)
 *   - base-uri: self
 *   - form-action: self
 *
 * Application:
 *   applyCspMeta() injects the policy as a <meta http-equiv="Content-Security-Policy">
 *   tag in document.head. This is called at app boot from main.ts, after
 *   the theme tokens are injected but before the router starts.
 *
 *   In production with a real backend, the CSP should also be sent as an
 *   HTTP response header by the server — this meta tag is the client-side
 *   enforcement that works even without server headers.
 */
import { getApiBaseUrl } from '../config/env';

/**
 * Builds the CSP directive string from the current environment configuration.
 * The connect-src directive includes the API base URL from config/env.ts
 * so it always matches the configured backend.
 */
export function buildCspDirectives(): string {
  const apiUrl = getApiBaseUrl();
  const connectSrc = `'self' ${apiUrl}`;

  return [
    `default-src 'self'`,
    `script-src 'self'`,
    `style-src 'self' 'unsafe-inline'`,
    `connect-src ${connectSrc}`,
    `img-src 'self' data: https:`,
    `frame-src 'none'`,
    `font-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join('; ');
}

/**
 * Applies the CSP by injecting a <meta http-equiv="Content-Security-Policy">
 * tag into document.head. Called at app boot.
 *
 * If a CSP meta tag already exists (e.g. from index.html's static tag),
 * it is replaced with this authoritative, programmatically-configured version.
 */
export function applyCspMeta(): void {
  if (typeof document === 'undefined') return;

  const csp = buildCspDirectives();

  // Remove any existing CSP meta tag
  const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existing) {
    existing.remove();
  }

  // Inject the authoritative CSP meta tag
  const meta = document.createElement('meta');
  meta.setAttribute('http-equiv', 'Content-Security-Policy');
  meta.setAttribute('content', csp);
  document.head.appendChild(meta);
}

/**
 * Returns the CSP directive string for inspection/testing.
 */
export function getCspPolicy(): string {
  return buildCspDirectives();
}