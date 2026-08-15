/**
 * ReportService.ts — services/
 *
 * Purpose:
 *   Orchestrates report generation/filtering for ActivityLogElement's
 *   emitted 'filters-changed' events and the broader Reports module.
 */

export interface ActivityLogEntry {
  readonly id: string;
  readonly action: string;
  readonly actorId: string;
  readonly actorName: string;
  readonly timestamp: Date;
  readonly details: string | null;
}

export interface Report {
  readonly id: string;
  readonly type: string;
  readonly generatedAt: Date;
  readonly data: unknown;
}

export interface ActivityLogFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
}

export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  clientId?: string;
}

export interface ScheduleReportConfig {
  type: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  filters: ReportFilter;
}

export interface ReportRepository {
  getActivityLog(filters: ActivityLogFilter): Promise<ActivityLogEntry[]>;
  generateReport(type: string, filters: ReportFilter): Promise<Report>;
  scheduleReport(config: ScheduleReportConfig): Promise<void>;
  getReportHistory(): Promise<Report[]>;
}

export class ReportService {
  constructor(private readonly reportRepo: ReportRepository) {}

  async getActivityLog(filters: ActivityLogFilter): Promise<ActivityLogEntry[]> {
    return await this.reportRepo.getActivityLog(filters);
  }

  async generateReport(type: string, filters: ReportFilter): Promise<Report> {
    return await this.reportRepo.generateReport(type, filters);
  }

  async scheduleReport(config: ScheduleReportConfig): Promise<void> {
    await this.reportRepo.scheduleReport(config);
  }

  async getReportHistory(): Promise<Report[]> {
    return await this.reportRepo.getReportHistory();
  }
}