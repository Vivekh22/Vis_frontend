/**
 * DashboardPageElement.test.ts — integration test for the Client dashboard page.
 *
 * Verifies the full mount chain: page → shared components → service data.
 * Tests that loading state shows before data resolves, then chart + KPIs render.
 *
 * Mocks the dashboardService so we don't depend on timer-based mock data.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardPageElement } from '../../../../pages/client/dashboard/DashboardPageElement';

vi.mock('../../../../services', () => ({
  dashboardService: {
    getDashboardSummary: vi.fn(),
  },
}));

// Import after mock so the mock takes effect.
import { dashboardService } from '../../../../services';

void DashboardPageElement;

const MOCK_SUMMARY = {
  kpiValues: { Impressions: 12500, Clicks: 340, Spend: 1200, Revenue: 3400 },
  chartData: [
    { label: 'Mon', value: 1200 },
    { label: 'Tue', value: 1800 },
  ],
  previousKpiValues: { Impressions: 10000, Clicks: 420, Spend: 950, Revenue: 2800 },
  insight: 'Clicks fell 19% vs. previous period.',
  deltas: {
    Impressions: { value: 25, direction: 'up' as const },
    Clicks: { value: -19, direction: 'down' as const },
    Spend: { value: 26, direction: 'up' as const },
    Revenue: { value: 21, direction: 'up' as const },
  },
};

describe('DashboardPageElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('renders skeleton loading state on mount', () => {
    vi.mocked(dashboardService.getDashboardSummary).mockReturnValue(new Promise(() => {}));
    const el = document.createElement('client-dashboard') as DashboardPageElement;
    document.body.appendChild(el);
    const loading = el.shadowRoot!.querySelector('loading-state');
    expect(loading).not.toBeNull();
  });

  it('renders chart and KPI cards after data loads', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue(MOCK_SUMMARY);
    const el = document.createElement('client-dashboard') as DashboardPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const loading = el.shadowRoot!.querySelector('loading-state');
    expect(loading).toBeNull();

    const chart = el.shadowRoot!.querySelector('chart-widget');
    expect(chart).not.toBeNull();

    const kpiCards = el.shadowRoot!.querySelectorAll('.kpi-card');
    expect(kpiCards.length).toBeGreaterThan(0);

    const title = el.shadowRoot!.querySelector('.dashboard-title');
    expect(title?.textContent).toBe('Dashboard');
  });

  it('renders KPI values from the service', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue(MOCK_SUMMARY);
    const el = document.createElement('client-dashboard') as DashboardPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const kpiValues = Array.from(el.shadowRoot!.querySelectorAll('.kpi-value')).map(
      (n: Element) => n.textContent,
    );
    expect(kpiValues).toContain('12,500');
    expect(kpiValues).toContain('340');
  });

  it('renders insight line from service', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue(MOCK_SUMMARY);
    const el = document.createElement('client-dashboard') as DashboardPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const insight = el.shadowRoot!.querySelector('.insight-line');
    expect(insight?.textContent).toContain('Clicks fell 19%');
  });

  it('renders KPI delta arrows', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue(MOCK_SUMMARY);
    const el = document.createElement('client-dashboard') as DashboardPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const upDeltas = el.shadowRoot!.querySelectorAll('.kpi-delta.up');
    const downDeltas = el.shadowRoot!.querySelectorAll('.kpi-delta.down');
    expect(upDeltas.length).toBeGreaterThan(0);
    expect(downDeltas.length).toBeGreaterThan(0);
  });

  it('renders empty state when data fetch fails', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockRejectedValue(new Error('fail'));
    const el = document.createElement('client-dashboard') as DashboardPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const emptyState = el.shadowRoot!.querySelector('empty-state');
    expect(emptyState).not.toBeNull();
  });

  it('renders report shortcut tiles', async () => {
    vi.mocked(dashboardService.getDashboardSummary).mockResolvedValue(MOCK_SUMMARY);
    const el = document.createElement('client-dashboard') as DashboardPageElement;
    document.body.appendChild(el);
    await new Promise((r) => setTimeout(r, 50));

    const tiles = el.shadowRoot!.querySelectorAll('report-shortcut-tile');
    expect(tiles.length).toBe(5);
  });
});