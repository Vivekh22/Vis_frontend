// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import { ClientLayoutElement } from '../../layouts/ClientLayoutElement';
import { ALL_CLIENT_NAV } from '../../layouts/ClientLayoutElement';
import { User } from '../../core/entities/User';
import '../../layouts/ClientLayoutElement';

describe('ClientLayoutElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the topbar with logo and horizontal nav', () => {
    const el = document.createElement('client-layout') as ClientLayoutElement;
    document.body.appendChild(el);
    const logo = el.shadowRoot!.querySelector('.sidebar-logo');
    expect(logo?.textContent).toBe('VispriscaAds');
    const nav = el.shadowRoot!.querySelector('collapsible-nav');
    expect(nav).not.toBeNull();
    document.body.removeChild(el);
  });

  it.skip('renders all client nav items', () => {
    const el = document.createElement('client-layout') as ClientLayoutElement;
    document.body.appendChild(el);
    const nav = el.shadowRoot!.querySelector('collapsible-nav') as any;
    expect(nav.items.some((i: any) => i.label === 'Dashboard')).toBe(true);
    document.body.removeChild(el);
  });

  it('mounts impersonation-banner and notification-bell', () => {
    const el = document.createElement('client-layout') as ClientLayoutElement;
    document.body.appendChild(el);
    expect(el.shadowRoot!.querySelector('impersonation-banner')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('notification-bell')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('renders a slot for page content', () => {
    const el = document.createElement('client-layout') as ClientLayoutElement;
    document.body.appendChild(el);
    expect(el.shadowRoot!.querySelector('slot')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('accepts a User entity as input', () => {
    const el = document.createElement('client-layout') as ClientLayoutElement;
    document.body.appendChild(el);
    const user = new User('u1', 'client@visprisca.ads', 'Client One', 'client');
    el.user = user;
    // Should not throw; re-renders
    expect(el.shadowRoot!.querySelector('.sidebar-logo')).not.toBeNull();
    document.body.removeChild(el);
  });
});