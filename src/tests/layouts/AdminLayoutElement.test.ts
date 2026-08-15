import { describe, it, expect, beforeEach } from 'vitest';
import type { AdminLayoutElement } from '../../layouts/AdminLayoutElement';
import { ADMIN_NAV_GROUPS } from '../../layouts/AdminLayoutElement';
import { User } from '../../core/entities/User';
import '../../layouts/AdminLayoutElement';

describe('AdminLayoutElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the sidebar with grouped navigation', () => {
    const el = document.createElement('admin-layout') as AdminLayoutElement;
    document.body.appendChild(el);
    const user = new User('a1', 'admin@visprisca.ads', 'Admin One', 'admin', {
      dashboard: 'view',
      clients: 'view',
      campaigns: 'approve',
      billing: 'view',
      settings: 'view',
    });
    el.user = user;
    const groups = el.shadowRoot!.querySelectorAll('.nav-group');
    expect(groups.length).toBe(ADMIN_NAV_GROUPS.length);
    document.body.removeChild(el);
  });

  it('filters nav groups based on user permissions — hides modules with none', () => {
    const el = document.createElement('admin-layout') as AdminLayoutElement;
    document.body.appendChild(el);
    const user = new User('a1', 'admin@visprisca.ads', 'Admin One', 'admin', {
      campaigns: 'approve',
    });
    el.user = user;
    const groupLabels = Array.from(el.shadowRoot!.querySelectorAll('.nav-group-label')).map(
      (n: Element) => n.textContent,
    );
    // Only the Campaigns group should be visible (the only module with permission)
    expect(groupLabels).toContain('Campaigns');
    expect(groupLabels).not.toContain('Overview');
    expect(groupLabels).not.toContain('Financial');
    document.body.removeChild(el);
  });

  it('shows no nav groups when user has no permissions', () => {
    const el = document.createElement('admin-layout') as AdminLayoutElement;
    document.body.appendChild(el);
    const user = new User('a1', 'admin@visprisca.ads', 'Admin One', 'admin');
    el.user = user;
    const groups = el.shadowRoot!.querySelectorAll('.nav-group');
    // The "No Access" group is rendered
    expect(groups.length).toBe(1);
    document.body.removeChild(el);
  });

  it('mounts impersonation-banner, notification-bell, and theme-toggle', () => {
    const el = document.createElement('admin-layout') as AdminLayoutElement;
    document.body.appendChild(el);
    const user = new User('a1', 'admin@visprisca.ads', 'Admin One', 'admin', { dashboard: 'view' });
    el.user = user;
    expect(el.shadowRoot!.querySelector('impersonation-banner')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('notification-bell')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('theme-toggle')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('renders a slot for page content', () => {
    const el = document.createElement('admin-layout') as AdminLayoutElement;
    document.body.appendChild(el);
    expect(el.shadowRoot!.querySelector('slot')).not.toBeNull();
    document.body.removeChild(el);
  });
});