// @ts-nocheck
/**
 * OverviewPageElement.test.ts — integration test for the Admin overview page.
 *
 * Verifies the page composes ApprovalQueueElement and EmptyStateElement,
 * and renders aggregate performance cards.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OverviewPageElement } from '../../../../pages/admin/overview/OverviewPageElement';
import '../../../../pages/admin/overview/OverviewPageElement';

vi.mock('../../../../services', () => ({
  dashboardService: {
    getDashboardSummary: vi.fn(),
  },
  approvalService: {
    listPendingApprovals: vi.fn(),
  },
  clientService: {
    listAtRiskClients: vi.fn(),
  },
}));

import { clientService, dashboardService, approvalService } from '../../../../services';

describe('Admin OverviewPageElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders the page title after loading', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue({ kpiValues: {}, insight: '' });
    vi.mocked(clientService.listAtRiskClients).mockResolvedValue([]);
    const el = document.createElement('admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const title = el.shadowRoot!.querySelector('.page-title');
    expect(title?.textContent).toBe('Admin Overview');
  });

  it('renders aggregate performance cards', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue({
      kpiValues: { Spend: 100, Revenue: 200, ROAS: 2, Campaigns: 5 },
      insight: '',
    });
    vi.mocked(clientService.listAtRiskClients).mockResolvedValue([]);
    const el = document.createElement('admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const cards = el.shadowRoot!.querySelectorAll('.perf-card');
    expect(cards.length).toBe(4);
  });

  it('mounts ApprovalQueueElement', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue({ kpiValues: {}, insight: '' });
    vi.mocked(clientService.listAtRiskClients).mockResolvedValue([]);
    const el = document.createElement('admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const queue = el.shadowRoot!.querySelector('approval-queue');
    expect(queue).not.toBeNull();
  });

  it('mounts EmptyStateElement for At-Risk Clients section', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue({ kpiValues: {}, insight: '' });
    vi.mocked(clientService.listAtRiskClients).mockResolvedValue([]);
    const el = document.createElement('admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const emptyState = el.shadowRoot!.querySelector('empty-state');
    expect(emptyState).not.toBeNull();
  });

  it('renders section titles', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue({ kpiValues: {}, insight: '' });
    vi.mocked(clientService.listAtRiskClients).mockResolvedValue([]);
    const el = document.createElement('admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const titles = Array.from(el.shadowRoot!.querySelectorAll('.section-title')).map(
      (n: Element) => n.textContent,
    );
    expect(titles).toContain('Aggregate Performance');
    expect(titles).toContain('Approval Backlog');
    expect(titles).toContain('At-Risk Clients');
    expect(titles).toContain('Recent Activity');
  });
});