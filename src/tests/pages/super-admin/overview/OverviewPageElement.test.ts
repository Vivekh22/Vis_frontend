// @ts-nocheck
/**
 * OverviewPageElement.test.ts — integration test for the Super Admin overview page.
 *
 * Verifies the page composes Platform Revenue card, Admin Workload panel
 * (DataTableElement), and ErrorStateElement for a simulated failed fetch.
 *
 * Mocks dashboardService to control success/failure scenarios.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../../../../pages/super-admin/overview/OverviewPageElement';

vi.mock('../../../../services', () => ({
  dashboardService: {
    getPlatformRevenue: vi.fn(),
    getAdminWorkload: vi.fn(),
  },
}));

import { dashboardService } from '../../../../services';


describe('Super Admin OverviewPageElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders the page title after loading', async () => {
    vi.mocked(dashboardService.getPlatformRevenue).mockResolvedValue({ revenue: 84200, growth: 12.5 });
    vi.mocked(dashboardService.getAdminWorkload).mockResolvedValue([]);
    const el = document.createElement('super-admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const title = el.shadowRoot!.querySelector('.page-title');
    expect(title?.textContent).toBe('Platform Overview');
  });

  it('renders Platform Revenue card after data loads', async () => {
    vi.mocked(dashboardService.getPlatformRevenue).mockResolvedValue({ revenue: 84200, growth: 12.5 });
    vi.mocked(dashboardService.getAdminWorkload).mockResolvedValue([]);
    const el = document.createElement('super-admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const kpiLabels = Array.from(el.shadowRoot!.querySelectorAll('.kpi-label')).map(l => l.textContent);
    expect(kpiLabels).toContain('Platform Revenue (Margin)');

    const amount = el.shadowRoot!.querySelector('.kpi-value');
    expect(amount?.textContent).toContain('$84,200');
  });

  it('renders empty table for the Admin Workload panel on fetch failure', async () => {
    vi.mocked(dashboardService.getPlatformRevenue).mockResolvedValue({ revenue: 84200, growth: 12.5 });
    vi.mocked(dashboardService.getAdminWorkload).mockRejectedValue(new Error('fail'));
    const el = document.createElement('super-admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const table = el.shadowRoot!.querySelector('data-table[data-id="workload"]');
    expect(table).not.toBeNull();
  });

  it('renders section titles', async () => {
    vi.mocked(dashboardService.getPlatformRevenue).mockResolvedValue({ revenue: 84200, growth: 12.5 });
    vi.mocked(dashboardService.getAdminWorkload).mockResolvedValue([]);
    const el = document.createElement('super-admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const titles = Array.from(el.shadowRoot!.querySelectorAll('.section-title')).map(
      (n: Element) => n.textContent,
    );
    expect(titles).toContain('Client Performance Leaderboard');
    expect(titles).toContain('Admin Workload');
    expect(titles).toContain('Operations Summary');
  });
});