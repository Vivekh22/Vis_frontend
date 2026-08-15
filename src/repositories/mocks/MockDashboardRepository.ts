/**
 * MockDashboardRepository.ts — repositories/mocks/
 *
 * Full mock implementation of the DashboardRepository interface.
 * Replaces Part 4's proof-of-concept mock entirely — this version
 * returns both current and previous-period data so DashboardService
 * can compute period-over-period deltas and the contextual insight line.
 *
 * The failNext flag is preserved for error-path testing (used by the
 * Super Admin overview page's ErrorStateElement demonstration).
 */
import type {
  DashboardRepository,
  DashboardKpiData,
  AdminWorkloadEntry,
  PlatformRevenue,
} from '../../services/DashboardService';
import type { DateRange } from '../../core/value-objects/DateRange';

export class MockDashboardRepository implements DashboardRepository {
  public failNext = false;

  async fetchDashboardData(period: DateRange): Promise<DashboardKpiData> {
    await this.delay();
    if (this.failNext) {
      this.failNext = false;
      throw new Error('Failed to fetch dashboard data');
    }
    // Vary data slightly by period to make deltas non-trivial.
    const dayDiff = Math.max(1, Math.round((period.end.getTime() - period.start.getTime()) / 86400000));
    return {
      kpiValues: {
        Impressions: 12500 + dayDiff * 10,
        Clicks: 340 + dayDiff,
        Installs: 87,
        Spend: 1200 + dayDiff * 5,
        Revenue: 3400 + dayDiff * 8,
      },
      chartData: [
        { label: 'Mon', value: 1200 },
        { label: 'Tue', value: 1800 },
        { label: 'Wed', value: 1500 },
        { label: 'Thu', value: 2100 },
        { label: 'Fri', value: 1900 },
        { label: 'Sat', value: 800 },
        { label: 'Sun', value: 600 },
      ],
    };
  }

  async fetchPreviousPeriodData(_period: DateRange): Promise<Record<string, number>> {
    await this.delay();
    if (this.failNext) {
      this.failNext = false;
      throw new Error('Failed to fetch previous period data');
    }
    // Previous period has lower spend but higher clicks — exercises both
    // rising and falling cases for the insight generator.
    return {
      Impressions: 10000,
      Clicks: 420,
      Installs: 80,
      Spend: 950,
      Revenue: 2800,
    };
  }

  async fetchAdminWorkload(): Promise<AdminWorkloadEntry[]> {
    await this.delay();
    if (this.failNext) {
      this.failNext = false;
      throw new Error('Failed to fetch admin workload');
    }
    return [
      { admin: 'Alice Chen', pendingApprovals: 5, activeClients: 12 },
      { admin: 'Bob Smith', pendingApprovals: 3, activeClients: 8 },
      { admin: 'Carol Diaz', pendingApprovals: 7, activeClients: 15 },
    ];
  }

  async fetchPlatformRevenue(): Promise<PlatformRevenue> {
    await this.delay();
    if (this.failNext) {
      this.failNext = false;
      throw new Error('Failed to fetch platform revenue');
    }
    return { revenue: 84200, growth: 12.5 };
  }

  private delay(ms = 100): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}