/**
 * DashboardService.ts — services/
 *
 * Purpose:
 *   Orchestrates dashboard data retrieval and comparison/insight generation.
 *   The service owns the business logic for computing period-over-period
 *   deltas and generating the contextual insight line — NOT the page
 *   component. This keeps presentation separate from computation.
 *
 * Insight generation — rule-based, not ML:
 *   The insight templates off whichever KPI moved the most (by absolute
 *   percentage change) between the current and previous period. This is
 *   intentionally simple: "Spend rose 18% vs. previous period." No ML, no
 *   anomaly detection — just the single most actionable delta surfaced
 *   as a human-readable sentence.
 *
 * Partial-failure pattern (same as bulkUpdateStatus in CampaignService):
 *   fetchAdminWorkload and fetchPlatformRevenue are independent of the
 *   client dashboard summary — they serve the Super Admin overview.
 */
import type { DateRange } from '../core/value-objects/DateRange';

export interface DashboardKpiData {
  kpiValues: Record<string, number>;
  chartData: { label: string; value: number }[];
}

export interface DashboardSummary extends DashboardKpiData {
  previousKpiValues: Record<string, number>;
  insight: string;
  deltas: Record<string, { value: number; direction: 'up' | 'down' | 'flat' }>;
}

export interface AdminWorkloadEntry {
  admin: string;
  pendingApprovals: number;
  activeClients: number;
}

export interface PlatformRevenue {
  revenue: number;
  growth: number;
}

export interface DashboardRepository {
  fetchDashboardData(period: DateRange): Promise<DashboardKpiData>;
  fetchPreviousPeriodData(period: DateRange): Promise<Record<string, number>>;
  fetchAdminWorkload(): Promise<AdminWorkloadEntry[]>;
  fetchPlatformRevenue(): Promise<PlatformRevenue>;
}

export class DashboardService {
  constructor(private readonly dashboardRepo: DashboardRepository) {}

  async getDashboardSummary(period: DateRange): Promise<DashboardSummary> {
    const [currentData, previousKpiValues] = await Promise.all([
      this.dashboardRepo.fetchDashboardData(period),
      this.dashboardRepo.fetchPreviousPeriodData(period),
    ]);

    const deltas = this.computeDeltas(currentData.kpiValues, previousKpiValues);
    const insight = this.generateInsight(currentData.kpiValues, previousKpiValues, deltas);

    return {
      kpiValues: currentData.kpiValues,
      chartData: currentData.chartData,
      previousKpiValues,
      insight,
      deltas,
    };
  }

  async getAdminWorkload(): Promise<AdminWorkloadEntry[]> {
    return await this.dashboardRepo.fetchAdminWorkload();
  }

  async getPlatformRevenue(): Promise<PlatformRevenue> {
    return await this.dashboardRepo.fetchPlatformRevenue();
  }

  /**
   * Computes the percentage delta for each KPI between current and previous
   * period. Returns a map of KPI name → { value (percentage), direction }.
   * Division by zero (previous = 0) yields direction 'flat' with value 0
   * — "infinity% increase" is not useful to a user.
   */
  public computeDeltas(
    current: Record<string, number>,
    previous: Record<string, number>,
  ): Record<string, { value: number; direction: 'up' | 'down' | 'flat' }> {
    const result: Record<string, { value: number; direction: 'up' | 'down' | 'flat' }> = {};
    for (const key of Object.keys(current)) {
      const curr = current[key]!;
      const prev = previous[key] ?? 0;
      if (prev === 0) {
        result[key] = { value: 0, direction: 'flat' };
        continue;
      }
      const pct = ((curr - prev) / Math.abs(prev)) * 100;
      const rounded = Math.round(pct);
      result[key] = {
        value: rounded,
        direction: rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat',
      };
    }
    return result;
  }

  /**
   * Generates a single insight sentence about the KPI that moved the most.
   * Templates off the largest absolute percentage change — "Spend rose 18%
   * vs. previous period" or "Clicks fell 12% vs. previous period."
   *
   * If no KPIs have previous data, returns a neutral message.
   */
  public generateInsight(
    current: Record<string, number>,
    _previous: Record<string, number>,
    deltas: Record<string, { value: number; direction: 'up' | 'down' | 'flat' }>,
  ): string {
    let maxKey: string | null = null;
    let maxAbsValue = 0;
    for (const key of Object.keys(deltas)) {
      const delta = deltas[key]!;
      const absValue = Math.abs(delta.value);
      if (absValue > maxAbsValue) {
        maxAbsValue = absValue;
        maxKey = key;
      }
    }

    if (!maxKey || maxAbsValue === 0) {
      const keys = Object.keys(current);
      if (keys.length === 0) return 'No data available for this period.';
      return 'Performance is stable compared to the previous period.';
    }

    const delta = deltas[maxKey]!;
    const verb = delta.direction === 'up' ? 'rose' : 'fell';
    return `${maxKey} ${verb} ${Math.abs(delta.value)}% vs. previous period.`;
  }
}