/**
 * Router.test.ts — unit tests for platform/router/Router.ts.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Router } from '../../../platform/router/Router';
import { Route } from '../../../platform/router/Route';
import { authStore } from '../../../platform/state/AuthStore';
import type { User } from '../../../platform/types';
import { html, render } from '../../../platform/rendering/SafeHtml';

class PublicPage extends HTMLElement {
  connectedCallback(): void {
    render(this, html`<div id="pub">public</div>`);
  }
}
class ProtectedPage extends HTMLElement {
  connectedCallback(): void {
    render(this, html`<div id="pro">protected</div>`);
  }
}

customElements.define('router-public-page', PublicPage);
customElements.define('router-protected-page', ProtectedPage);

const clientUser: User = {
  id: 'u1',
  email: 'client@visprisca.ads',
  fullName: 'Client One',
  role: 'client',
};

describe('Router', () => {
  let root: HTMLElement;
  let router: Router;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    authStore.logout();
    const routes = [
      new Route({
        path: '/login',
        component: PublicPage,
        requiredRole: null,
        requiredPermission: null,
      }),
      new Route({
        path: '/dashboard',
        component: ProtectedPage,
        requiredRole: ['client'],
        requiredPermission: null,
      }),
    ];
    router = new Router(routes, root);
    router.start();
  });

  afterEach(() => {
    router.stop();
    document.body.removeChild(root);
  });

  it('mounts the expected component for a valid permitted route', () => {
    authStore.login(clientUser);
    router.navigate('/dashboard');
    expect(root.querySelector('#pro')).not.toBeNull();
  });

  it('redirects to login when not permitted', () => {
    router.navigate('/dashboard');
    expect(root.querySelector('#pub')).not.toBeNull();
  });

  it('triggers not-found handling for an unknown path', () => {
    authStore.login(clientUser);
    router.navigate('/nope');
    expect(root.textContent).toContain('404');
  });

  it('re-navigates on a simulated browser back-button (popstate) event', () => {
    authStore.login(clientUser);
    router.navigate('/dashboard');
    expect(root.querySelector('#pro')).not.toBeNull();
    // Simulate the browser's back-button: on a real browser, hitting "back"
    // updates window.location.pathname to the previous entry's URL and fires
    // popstate. happy-dom does not update location.pathname on pushState, so we
    // mock the pathname the browser would have set, then dispatch popstate.
    const originalPathname = window.location.pathname;
    Object.defineProperty(window.location, 'pathname', {
      configurable: true,
      get: () => '/login',
    });
    window.dispatchEvent(new Event('popstate'));
    expect(root.querySelector('#pub')).not.toBeNull();
    Object.defineProperty(window.location, 'pathname', {
      configurable: true,
      get: () => originalPathname,
    });
  });
});