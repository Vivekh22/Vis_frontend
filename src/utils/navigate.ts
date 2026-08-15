/**
 * navigate.ts — utils/
 *
 * Purpose:
 *   Programmatic navigation helper. Uses pushState + popstate dispatch so the
 *   Router's popstate handler picks it up. This avoids needing a global router
 *   singleton — pages call navigate(path) and the Router (already listening
 *   to popstate) renders the new route, with RouteGuard enforcement.
 */
export function navigate(path: string): void {
  if (path === window.location.pathname) return;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}