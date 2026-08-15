/**
 * integration-example.ts — platform/
 *
 * A minimal end-to-end demonstration that the platform/ layer works together:
 * a concrete BaseComponent subclass, registered via ComponentRegistry,
 * subscribed to authStore, and mounted through a Router with one public route
 * and one role-protected route.
 *
 * Not a real page — just a wiring check. main.ts calls bootstrapIntegrationDemo()
 * so the project is reviewable standalone. As later parts are built, this is
 * replaced by the real application bootstrap.
 */
import { BaseComponent } from './component/BaseComponent';
import { ComponentRegistry } from './component/ComponentRegistry';
import { html } from './rendering/SafeHtml';
import { authStore } from './state/AuthStore';
import { Route } from './router/Route';
import { Router } from './router/Router';
import { themeManager } from '../styles/theme';
import { TOKEN_CSS_TEXT } from '../styles/tokens';

class WelcomePage extends BaseComponent {
  private unsubscribe: (() => void) | null = null;

  protected renderTemplate(): string {
    const auth = authStore.getState();
    const greeting = auth.isAuthenticated
      ? `Signed in as ${auth.currentUser?.email}`
      : 'Not signed in';
    return html`
      <style>
        :host {
          display: block;
          padding: var(--space-8, 2rem);
          font-family: var(--font-body, system-ui, sans-serif);
        }
        h1 {
          color: var(--color-primary, #4f46e5);
          font-size: var(--font-size-2xl, 1.5rem);
          margin: 0 0 var(--space-4, 1rem);
        }
        p {
          color: var(--color-text-muted, #64748b);
        }
      </style>
      <h1>VispriscaAds</h1>
      <p>${greeting}</p>
    `;
  }

  protected onMount(): void {
    // Subscribe to auth changes; re-render when auth state changes.
    this.unsubscribe = authStore.subscribe(() => this.rerender());
  }

  protected onUnmount(): void {
    // Prevent memory leaks — the unsubscribe fn from the store is called here.
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}

class DashboardPage extends BaseComponent {
  protected renderTemplate(): string {
    return html`
      <style>
        :host {
          display: block;
          padding: var(--space-8, 2rem);
          font-family: var(--font-body, system-ui, sans-serif);
        }
        h2 {
          color: var(--color-text-primary, #0f172a);
          font-size: var(--font-size-xl, 1.25rem);
        }
      </style>
      <h2>Dashboard</h2>
      <p>Protected route — visible to clients.</p>
    `;
  }
}

ComponentRegistry.register('demo-welcome', WelcomePage);
ComponentRegistry.register('demo-dashboard', DashboardPage);

/**
 * Boots the integration demo into `root`. Injects design tokens at the document
 * level (so light-DOM children resolve CSS variables), initialises the theme
 * (Light/Dark/System), and starts the router with one public and one
 * role-protected route.
 */
export function bootstrapIntegrationDemo(root: HTMLElement): Router {
  // Inject design tokens at document level for light-DOM consumers.
  const tokenStyle = document.createElement('style');
  tokenStyle.id = 'va-tokens';
  tokenStyle.textContent = TOKEN_CSS_TEXT;
  document.head.appendChild(tokenStyle);

  themeManager.init('system');

  const routes = [
    new Route({
      path: '/',
      component: WelcomePage,
      requiredRole: null,
      requiredPermission: null,
    }),
    new Route({
      path: '/dashboard',
      component: DashboardPage,
      requiredRole: ['client'],
      requiredPermission: null,
    }),
  ];

  const router = new Router(routes, root);
  router.start();
  return router;
}