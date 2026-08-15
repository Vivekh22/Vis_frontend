import { describe, it, expect, beforeEach } from 'vitest';
import type { ClientLayoutElement } from '../../layouts/ClientLayoutElement';
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
    const logo = el.shadowRoot!.querySelector('.logo');
    expect(logo?.textContent).toBe('VispriscaAds');
    const navItems = el.shadowRoot!.querySelectorAll('.nav .nav-item');
    expect(navItems.length).toBe(ALL_CLIENT_NAV.length);
    document.body.removeChild(el);
  });

  it('renders all client nav items', () => {
    const el = document.createElement('client-layout') as ClientLayoutElement;
    document.body.appendChild(el);
    const navTexts = Array.from(el.shadowRoot!.querySelectorAll('.nav .nav-item')).map((n: Element) => n.textContent);
    expect(navTexts).toContain('Dashboard');
    expect(navTexts).toContain('Campaigns');
    expect(navTexts).toContain('Fund');
    expect(navTexts).toContain('Settings');
    document.body.removeChild(el);
  });

  it('mounts impersonation-banner, notification-bell, and theme-toggle', () => {
    const el = document.createElement('client-layout') as ClientLayoutElement;
    document.body.appendChild(el);
    expect(el.shadowRoot!.querySelector('impersonation-banner')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('notification-bell')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('theme-toggle')).not.toBeNull();
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
    expect(el.shadowRoot!.querySelector('.logo')).not.toBeNull();
    document.body.removeChild(el);
  });
});