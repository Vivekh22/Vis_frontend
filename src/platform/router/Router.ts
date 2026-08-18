/**
 * Router.ts — platform/router/
 *
 * Purpose:
 *   Top-level SPA orchestrator. Ties Route[] + RouteGuard together: listens to
 *   popstate and intercepted internal link clicks, matches paths, guards
 *   access, mounts page components, and cleans up unmounted components.
 *
 * Internal links:
 *   Links with the `data-router-link` attribute are intercepted: a normal click
 *   is preventDefault()'d and the router navigates via history.pushState,
 *   avoiding a full page reload. Other links behave normally.
 *
 * Cleanup:
 *   When replacing the mounted page, the previous element is removed from the
 *   DOM, letting its disconnectedCallback → onUnmount() run naturally so event
 *   listeners / subscriptions are cleaned up. This is critical for preventing
 *   memory leaks across a 50+ page app.
 */
import { Route } from './Route';
import { RouteGuard } from './RouteGuard';
import { renderNotFound } from './NotFoundHandler';
import { authStore } from '../state/AuthStore';
import type { User } from '../types';

const LINK_SELECTOR = 'a[data-router-link]';

export class Router {
  private readonly routes: Route[];
  private readonly root: HTMLElement;
  private readonly clickHandler: (event: MouseEvent) => void;
  private readonly popstateHandler: (event: Event) => void;

  constructor(routes: Route[], root: HTMLElement) {
    this.routes = routes;
    this.root = root;
    this.clickHandler = this.onLinkClick.bind(this);
    this.popstateHandler = this.onPopState.bind(this);
  }

  /** Starts listening for navigation events and renders the current URL. */
  public start(): void {
    document.addEventListener('click', this.clickHandler);
    window.addEventListener('popstate', this.popstateHandler);
    this.renderRoute(window.location.pathname);
  }

  /** Stops listening. Call when tearing down the app (rare). */
  public stop(): void {
    document.removeEventListener('click', this.clickHandler);
    window.removeEventListener('popstate', this.popstateHandler);
  }

  /**
   * Navigates to `path`: pushState + renderRoute. Used by intercepted link
   * clicks and programmatic navigation. No-op if the path is already current.
   */
  public navigate(path: string): void {
    if (path === window.location.pathname) {
      return;
    }
    
    // Check global navigation guard
    if (typeof (window as any).__navigationGuard === 'function') {
      const canNavigate = (window as any).__navigationGuard(path);
      if (!canNavigate) return; // Guard blocked navigation
    }

    window.history.pushState({}, '', path);
    this.renderRoute(path);
  }

  private onLinkClick(event: MouseEvent): void {
    // Use composedPath() so clicks originating inside a shadow root are still
    // resolved to their real target (the <a> element). event.target would be
    // retargeted to the shadow host, making closest() miss the anchor.
    const path = event.composedPath();
    const origin = path[0] as Element | null;
    if (!origin || !(origin instanceof Element)) return;
    const link = origin.closest(LINK_SELECTOR) as HTMLAnchorElement | null;
    if (!link) return;
    event.preventDefault();
    const pathAttr = link.getAttribute('href');
    if (!pathAttr) return;
    this.navigate(pathAttr);
  }

  private onPopState(): void {
    if (typeof (window as any).__navigationGuard === 'function') {
      const canNavigate = (window as any).__navigationGuard(window.location.pathname);
      if (!canNavigate) {
        // We can't easily undo the back button natively without tracking history,
        // but for this MVP, we can just block rendering the new route.
        // The URL will change but the view won't.
        return;
      }
    }
    this.renderRoute(window.location.pathname);
  }

  private renderRoute(path: string): void {
    let matchedRoute: Route | null = null;
    for (const route of this.routes) {
      if (route.matches(path).matched) {
        matchedRoute = route;
        break;
      }
    }
    if (!matchedRoute) {
      this.unmountCurrent();
      renderNotFound(this.root);
      return;
    }
    if (!RouteGuard.canActivate(matchedRoute)) {
      const redirect = RouteGuard.getRedirectPath(matchedRoute);
      if (redirect !== path) {
        window.history.replaceState({}, '', redirect);
        this.renderRoute(redirect);
      } else {
        this.unmountCurrent();
        renderNotFound(this.root);
      }
      return;
    }
    this.unmountCurrent();
    const pageElement = new matchedRoute.component();
    if (matchedRoute.layoutComponent) {
      const layout = new matchedRoute.layoutComponent() as HTMLElement & { user: User | null };
      const auth = authStore.getState();
      layout.user = auth.currentUser ?? null;
      layout.appendChild(pageElement);
      this.root.appendChild(layout);
    } else {
      this.root.appendChild(pageElement);
    }
  }

  private unmountCurrent(): void {
    // Remove previous children so their disconnectedCallback → onUnmount runs.
    while (this.root.firstChild) {
      this.root.removeChild(this.root.firstChild);
    }
  }
}