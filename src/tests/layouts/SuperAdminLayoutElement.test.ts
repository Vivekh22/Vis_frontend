import { describe, it, expect, beforeEach } from 'vitest';
import type { SuperAdminLayoutElement } from '../../layouts/SuperAdminLayoutElement';
import { SUPER_ADMIN_NAV } from '../../layouts/SuperAdminLayoutElement';
import { User } from '../../core/entities/User';
import '../../layouts/SuperAdminLayoutElement';

describe('SuperAdminLayoutElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the sidebar with all 7 groups', () => {
    const el = document.createElement('super-admin-layout') as SuperAdminLayoutElement;
    document.body.appendChild(el);
    const user = new User('sa1', 'super@visprisca.ads', 'Super Admin', 'super-admin');
    el.user = user;
    const groups = el.shadowRoot!.querySelectorAll('.nav-group');
    expect(groups.length).toBe(SUPER_ADMIN_NAV.length);
    expect(SUPER_ADMIN_NAV.length).toBe(7);
    document.body.removeChild(el);
  });

  it('renders all 22 nav tabs', () => {
    const el = document.createElement('super-admin-layout') as SuperAdminLayoutElement;
    document.body.appendChild(el);
    const user = new User('sa1', 'super@visprisca.ads', 'Super Admin', 'super-admin');
    el.user = user;
    const navItems = el.shadowRoot!.querySelectorAll('.nav-item');
    const totalTabs = SUPER_ADMIN_NAV.reduce<number>((sum, g) => sum + g.items.length, 0);
    expect(navItems.length).toBe(totalTabs);
    expect(totalTabs).toBe(22);
    document.body.removeChild(el);
  });

  it('renders all 7 group labels', () => {
    const el = document.createElement('super-admin-layout') as SuperAdminLayoutElement;
    document.body.appendChild(el);
    const user = new User('sa1', 'super@visprisca.ads', 'Super Admin', 'super-admin');
    el.user = user;
    const labels = Array.from(el.shadowRoot!.querySelectorAll('.nav-group-label')).map(
      (n: Element) => n.textContent,
    );
    expect(labels).toContain('Overview');
    expect(labels).toContain('Clients');
    expect(labels).toContain('Campaigns');
    expect(labels).toContain('Financial');
    expect(labels).toContain('System');
    expect(labels).toContain('Audit');
    expect(labels).toContain('Support');
    document.body.removeChild(el);
  });

  it('mounts impersonation-banner, notification-bell, and theme-toggle', () => {
    const el = document.createElement('super-admin-layout') as SuperAdminLayoutElement;
    document.body.appendChild(el);
    const user = new User('sa1', 'super@visprisca.ads', 'Super Admin', 'super-admin');
    el.user = user;
    expect(el.shadowRoot!.querySelector('impersonation-banner')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('notification-bell')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('theme-toggle')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('renders a slot for page content', () => {
    const el = document.createElement('super-admin-layout') as SuperAdminLayoutElement;
    document.body.appendChild(el);
    expect(el.shadowRoot!.querySelector('slot')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('does NOT filter nav — Super Admin sees all groups regardless of permissions map', () => {
    const el = document.createElement('super-admin-layout') as SuperAdminLayoutElement;
    document.body.appendChild(el);
    // Even with no permissions map, Super Admin sees all nav
    const user = new User('sa1', 'super@visprisca.ads', 'Super Admin', 'super-admin');
    el.user = user;
    const groups = el.shadowRoot!.querySelectorAll('.nav-group');
    expect(groups.length).toBe(7);
    document.body.removeChild(el);
  });
});