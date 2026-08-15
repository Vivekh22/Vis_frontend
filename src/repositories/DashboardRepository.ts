/**
 * DashboardRepository.ts — repositories/
 *
 * Real implementation of the DashboardRepository interface from DashboardService.
 * Calls the dashboard API endpoints and maps DTOs to domain shapes.
 *
 * Assumed endpoint shape (de facto API contract):
 *   GET /api/dashboard/summary?start=&end=     → DashboardDataDto
 *   GET /api/dashboard/previous?start=&end=     → KpiValuesDto
 *   GET /api/dashboard/admin-workload           → AdminWorkloadDto[]
 *   GET /api/dashboard/platform-revenue         → PlatformRevenueDto
 */
import type {
  DashboardRepository,
  DashboardKpiData,
  AdminWorkloadEntry,
  PlatformRevenue,
} from '../services/DashboardService';
import { ApiClient } from './ApiClient';

interface DashboardDataDto {
  kpiValues: Record<string, number>;
  chartData: { label: string; value: number }[];
}

export class DashboardRepositoryImpl implements DashboardRepository {
  constructor(private readonly api: ApiClient) {}

  async fetchDashboardData(period: { start: Date; end: Date }): Promise<DashboardKpiData> {
    const params = new URLSearchParams({
      start: period.start.toISOString(),
      end: period.end.toISOString(),
    });
    const dto = await this.api.get<DashboardDataDto>(`/api/dashboard/summary?${params.toString()}`);
    return { kpiValues: dto.kpiValues, chartData: dto.chartData };
  }

  async fetchPreviousPeriodData(period: { start: Date; end: Date }): Promise<Record<string, number>> {
    const params = new URLSearchParams({
      start: period.start.toISOString(),
      end: period.end.toISOString(),
    });
    const dto = await this.api.get<{ kpiValues: Record<string, number> }>(
      `/api/dashboard/previous?${params.toString()}`,
    );
    return dto.kpiValues;
  }

  async fetchAdminWorkload(): Promise<AdminWorkloadEntry[]> {
    return await this.api.get<AdminWorkloadEntry[]>('/api/dashboard/admin-workload');
  }

  async fetchPlatformRevenue(): Promise<PlatformRevenue> {
    return await this.api.get<PlatformRevenue>('/api/dashboard/platform-revenue');
  }
}