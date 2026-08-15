/**
 * MockReportRepository.ts — repositories/mocks/
 *
 * Minimal mock implementation of ReportRepository for ReportService.
 * Stores activity log entries and reports in memory. Temporary — real
 * repository implementations in Part 6.
 */
import type {
  ActivityLogEntry,
  Report,
  ActivityLogFilter,
  ReportFilter,
  ScheduleReportConfig,
  ReportRepository,
} from '../../services/ReportService';

export class MockReportRepository implements ReportRepository {
  private readonly activityLog: ActivityLogEntry[] = [];
  private readonly reports: Report[] = [];
  private readonly scheduledReports: ScheduleReportConfig[] = [];

  seedActivityLog(entries: ActivityLogEntry[]): void {
    this.activityLog.push(...entries);
  }

  async getActivityLog(filters: ActivityLogFilter): Promise<ActivityLogEntry[]> {
    let results = [...this.activityLog];
    if (filters.action) {
      results = results.filter((e) => e.action === filters.action);
    }
    if (filters.userId) {
      results = results.filter((e) => e.actorId === filters.userId);
    }
    return results;
  }

  async generateReport(type: string, filters: ReportFilter): Promise<Report> {
    const report: Report = {
      id: `rpt_${Date.now().toString(36)}`,
      type,
      generatedAt: new Date(),
      data: { filters, entries: [...this.activityLog] },
    };
    this.reports.push(report);
    return report;
  }

  async scheduleReport(config: ScheduleReportConfig): Promise<void> {
    this.scheduledReports.push(config);
  }

  async getReportHistory(): Promise<Report[]> {
    return [...this.reports];
  }

  getScheduledReports(): ScheduleReportConfig[] {
    return [...this.scheduledReports];
  }
}