/**
 * OverviewPageElement.test.ts — integration test for the Super Admin overview page.
 *
 * Verifies the page composes Platform Revenue card, Admin Workload panel
 * (DataTableElement), and ErrorStateElement for a simulated failed fetch.
 *
 * Mocks dashboardService to control success/failure scenarios.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OverviewPageElement } from '../../../../pages/super-admin/overview/OverviewPageElement';

vi.mock('../../../../services', () => ({
  dashboardService: {
    getPlatformRevenue: vi.fn(),
    getAdminWorkload: vi.fn(),
  },
}));

import { dashboardService } from '../../../../services';

void OverviewPageElement;

describe('Super Admin OverviewPageElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders the page title', () => {
    vi.mocked(dashboardService.getPlatformRevenue).mockReturnValue(new Promise(() => {}));
    vi.mocked(dashboardService.getAdminWorkload).mockReturnValue(new Promise(() => {}));
    const el = document.createElement('super-admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    const title = el.shadowRoot!.querySelector('.page-title');
    expect(title?.textContent).toBe('Platform Overview');
  });

  it('renders Platform Revenue card after data loads', async () => {
    vi.mocked(dashboardService.getPlatformRevenue).mockResolvedValue({ revenue: 84200, growth: 12.5 });
    vi.mocked(dashboardService.getAdminWorkload).mockResolvedValue([]);
    const el = document.createElement('super-admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const revenueCard = el.shadowRoot!.querySelector('.revenue-card');
    expect(revenueCard).not.toBeNull();

    const amount = el.shadowRoot!.querySelector('.revenue-amount');
    expect(amount?.textContent).toContain('$84,200');
  });

  it('renders ErrorStateElement for the Admin Workload panel (simulated fetch failure)', async () => {
    vi.mocked(dashboardService.getPlatformRevenue).mockResolvedValue({ revenue: 84200, growth: 12.5 });
    vi.mocked(dashboardService.getAdminWorkload).mockRejectedValue(new Error('fail'));
    const el = document.createElement('super-admin-overview') as OverviewPageElement;
    document.body.appendChild(el);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const errorState = el.shadowRoot!.querySelector('error-state');
    expect(errorState).not.toBeNull();
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
    expect(titles).toContain('Platform Revenue');
    expect(titles).toContain('Admin Workload');
  });
});