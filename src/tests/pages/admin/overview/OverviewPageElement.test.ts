/**
 * OverviewPageElement.test.ts — integration test for the Admin overview page.
 *
 * Verifies the page composes ApprovalQueueElement and EmptyStateElement,
 * and renders aggregate performance cards.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { OverviewPageElement } from '../../../../pages/admin/overview/OverviewPageElement';
import '../../../../pages/admin/overview/OverviewPageElement';

describe('Admin OverviewPageElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the page title', () => {
    const el = document.createElement('admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    const title = el.shadowRoot!.querySelector('.page-title');
    expect(title?.textContent).toBe('Admin Overview');
  });

  it('renders aggregate performance cards', () => {
    const el = document.createElement('admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    const cards = el.shadowRoot!.querySelectorAll('.perf-card');
    expect(cards.length).toBe(4);
  });

  it('mounts ApprovalQueueElement', () => {
    const el = document.createElement('admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    const queue = el.shadowRoot!.querySelector('approval-queue');
    expect(queue).not.toBeNull();
  });

  it('mounts EmptyStateElement for At-Risk Clients section', () => {
    const el = document.createElement('admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    const emptyState = el.shadowRoot!.querySelector('empty-state');
    expect(emptyState).not.toBeNull();
  });

  it('renders section titles', () => {
    const el = document.createElement('admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    const titles = Array.from(el.shadowRoot!.querySelectorAll('.section-title')).map(
      (n: Element) => n.textContent,
    );
    expect(titles).toContain('Aggregate Performance');
    expect(titles).toContain('Pending Approvals');
    expect(titles).toContain('At-Risk Clients');
  });
});