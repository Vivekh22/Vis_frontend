// @ts-nocheck
/**
 * DashboardService.test.ts — tests for the dashboard service.
 *
 * Tests:
 *   - getDashboardSummary returns insight + deltas
 *   - Insight generation: rising case (Spend rose)
 *   - Insight generation: falling case (Clicks fell)
 *   - Delta computation correctness
 *   - Division by zero (previous = 0) → flat
 *   - getAdminWorkload / getPlatformRevenue delegation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from '../../services/DashboardService';
import { DashboardService } from '../../services/DashboardService';
import { DateRange } from '../../core/value-objects/DateRange';

function createMockRepo(overrides: Partial<DashboardRepository> = {}): DashboardRepository {
  return {
    fetchDashboardData: vi.fn().mockResolvedValue({
      kpiValues: { Impressions: 12500, Clicks: 340, Spend: 1200, Revenue: 3400 },
      chartData: [{ label: 'Mon', value: 1200 }],
    }),
    fetchPreviousPeriodData: vi.fn().mockResolvedValue({
      Impressions: 10000, Clicks: 420, Spend: 950, Revenue: 2800,
    }),
    fetchAdminWorkload: vi.fn().mockResolvedValue([
      { admin: 'Alice', pendingApprovals: 5, activeClients: 12 },
    ]),
    fetchPlatformRevenue: vi.fn().mockResolvedValue({ revenue: 84200, growth: 12.5 }),
    ...overrides,
  };
}

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService(createMockRepo());
  });

  describe('getDashboardSummary', () => {
    it('returns kpiValues, chartData, previousKpiValues, insight, and deltas', async () => {
      const period = DateRange.fromPeriodOption('7d');
      const summary = await service.getDashboardSummary(period);
      expect(summary.kpiValues).toBeDefined();
      expect(summary.chartData).toBeDefined();
      expect(summary.previousKpiValues).toBeDefined();
      expect(summary.insight).toBeDefined();
      expect(summary.deltas).toBeDefined();
    });

    it('generates insight for the KPI with the largest percentage move', async () => {
      const period = DateRange.fromPeriodOption('7d');
      const summary = await service.getDashboardSummary(period);
      // Spend went from 950 to 1200 = +26.3% → ~26%
      // Clicks went from 420 to 340 = -19% → |-19|%
      // Impressions went from 10000 to 12500 = +25%
      // Spend (26%) is the largest absolute change.
      expect(summary.insight).toContain('Spend');
      expect(summary.insight).toContain('rose');
      expect(summary.insight).toContain('26%');
    });
  });

  describe('generateInsight', () => {
    it('generates rising insight', () => {
      const current = { Spend: 1200 };
      const previous = { Spend: 950 };
      const deltas = { Spend: { value: 26, direction: 'up' as const } };
      const insight = service.generateInsight(current, previous, deltas);
      expect(insight).toContain('Spend rose 26%');
    });

    it('generates falling insight', () => {
      const current = { Clicks: 340 };
      const previous = { Clicks: 420 };
      const deltas = { Clicks: { value: -19, direction: 'down' as const } };
      const insight = service.generateInsight(current, previous, deltas);
      expect(insight).toContain('Clicks fell 19%');
    });

    it('returns stable message when all deltas are 0', () => {
      const current = { Spend: 1000 };
      const previous = { Spend: 1000 };
      const deltas = { Spend: { value: 0, direction: 'flat' as const } };
      const insight = service.generateInsight(current, previous, deltas);
      expect(insight).toContain('stable');
    });

    it('returns no-data message when current is empty', () => {
      const insight = service.generateInsight({}, {}, {});
      expect(insight).toContain('No data');
    });
  });

  describe('computeDeltas', () => {
    it('computes positive delta for increase', () => {
      const deltas = service.computeDeltas({ Spend: 1200 }, { Spend: 950 });
      expect(deltas.Spend!.value).toBe(26);
      expect(deltas.Spend!.direction).toBe('up');
    });

    it('computes negative delta for decrease', () => {
      const deltas = service.computeDeltas({ Clicks: 340 }, { Clicks: 420 });
      expect(deltas.Clicks!.value).toBe(-19);
      expect(deltas.Clicks!.direction).toBe('down');
    });

    it('returns flat when previous is 0 (division by zero)', () => {
      const deltas = service.computeDeltas({ Spend: 1000 }, { Spend: 0 });
      expect(deltas.Spend!.value).toBe(0);
      expect(deltas.Spend!.direction).toBe('flat');
    });

    it('returns flat when no change', () => {
      const deltas = service.computeDeltas({ Spend: 1000 }, { Spend: 1000 });
      expect(deltas.Spend!.direction).toBe('flat');
    });
  });

  describe('getAdminWorkload', () => {
    it('delegates to repository', async () => {
      const result = await service.getAdminWorkload();
      expect(result).toHaveLength(1);
      expect(result[0]!.admin).toBe('Alice');
    });
  });

  describe('getPlatformRevenue', () => {
    it('delegates to repository', async () => {
      const result = await service.getPlatformRevenue();
      expect(result.revenue).toBe(84200);
      expect(result.growth).toBe(12.5);
    });
  });
});