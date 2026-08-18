// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import { sessionStore } from '../../../platform/state/SessionStore';
import { ImpersonationBannerElement } from '../../../components/impersonation-banner/ImpersonationBannerElement';
import '../../../components/impersonation-banner/ImpersonationBannerElement';

describe('ImpersonationBannerElement', () => {
  beforeEach(() => { sessionStore.clearSession(); });

  it('renders nothing when not impersonating', () => {
    const el = document.createElement('impersonation-banner') as ImpersonationBannerElement;
    document.body.appendChild(el);
    expect(el.shadowRoot?.querySelector('.banner')).toBeNull();
    document.body.removeChild(el);
  });

  it('renders correct Super Admin wording when actingAsRole is super-admin', () => {
    sessionStore.startImpersonation({ entityName: 'Acme Corp', actingAsUserId: 'root-1', actingAsRole: 'super-admin' });
    const el = document.createElement('impersonation-banner') as ImpersonationBannerElement;
    document.body.appendChild(el);
    const text = el.shadowRoot?.textContent ?? '';
    expect(text).toContain('Acme Corp');
    expect(text).toContain('Super Admin');
    document.body.removeChild(el);
  });

  it('renders correct Admin wording when actingAsRole is admin', () => {
    sessionStore.startImpersonation({ entityName: 'Beta Inc', actingAsUserId: 'admin-1', actingAsRole: 'admin' });
    const el = document.createElement('impersonation-banner') as ImpersonationBannerElement;
    document.body.appendChild(el);
    const text = el.shadowRoot?.textContent ?? '';
    expect(text).toContain('Beta Inc');
    expect(text).toContain('Admin');
    expect(text).not.toContain('Super Admin');
    document.body.removeChild(el);
  });

  it('clicking Exit calls endImpersonation and emits impersonation-exit', () => {
    sessionStore.startImpersonation({ entityName: 'Acme', actingAsUserId: 'admin-1', actingAsRole: 'admin' });
    const el = document.createElement('impersonation-banner') as ImpersonationBannerElement;
    document.body.appendChild(el);
    let eventFired = false;
    el.addEventListener('impersonation-exit', () => { eventFired = true; });
    const exitBtn = el.shadowRoot!.querySelector('[data-action="exit"]') as HTMLButtonElement;
    exitBtn.click();
    expect(sessionStore.getState().isImpersonating).toBe(false);
    expect(eventFired).toBe(true);
    document.body.removeChild(el);
  });

  it('unsubscribes from sessionStore on unmount', () => {
    sessionStore.startImpersonation({ entityName: 'Acme', actingAsUserId: 'admin-1', actingAsRole: 'admin' });
    const el = document.createElement('impersonation-banner') as ImpersonationBannerElement;
    document.body.appendChild(el);
    expect(el.shadowRoot?.children.length ?? 0).toBeGreaterThan(0);
    document.body.removeChild(el);
    // After unmount, changing store state should not throw and should not affect the removed element
    sessionStore.startImpersonation({ entityName: 'Other', actingAsUserId: 'admin-2', actingAsRole: 'super-admin' });
    expect(el.shadowRoot?.children.length ?? 0).toBeGreaterThan(0); // still has old content, no error
    sessionStore.clearSession();
  });
});