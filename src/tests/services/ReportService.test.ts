/**
 * ReportService.test.ts — tests for services/ReportService.
 *
 * Tests the ORCHESTRATION logic: getActivityLog filtering, generateReport
 * creation, scheduleReport persistence, getReportHistory retrieval.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ReportService } from '../../services/ReportService';
import type { ReportRepository, ActivityLogEntry, Report, ActivityLogFilter, ReportFilter, ScheduleReportConfig } from '../../services/ReportService';

class MockReportRepo implements ReportRepository {
  private log: ActivityLogEntry[] = [];
  private reports: Report[] = [];
  private scheduled: ScheduleReportConfig[] = [];

  seedLog(entries: ActivityLogEntry[]): void {
    this.log.push(...entries);
  }

  async getActivityLog(filters: ActivityLogFilter): Promise<ActivityLogEntry[]> {
    let results = [...this.log];
    if (filters.action) results = results.filter((e) => e.action === filters.action);
    if (filters.userId) results = results.filter((e) => e.actorId === filters.userId);
    return results;
  }

  async generateReport(type: string, filters: ReportFilter): Promise<Report> {
    const report: Report = {
      id: `rpt_${Date.now().toString(36)}`,
      type,
      generatedAt: new Date(),
      data: { filters },
    };
    this.reports.push(report);
    return report;
  }

  async scheduleReport(config: ScheduleReportConfig): Promise<void> {
    this.scheduled.push(config);
  }

  async getReportHistory(): Promise<Report[]> {
    return [...this.reports];
  }

  getScheduled(): ScheduleReportConfig[] {
    return [...this.scheduled];
  }
}

function makeEntry(id: string, action: string, actorId: string): ActivityLogEntry {
  return {
    id,
    action,
    actorId,
    actorName: `User ${actorId}`,
    timestamp: new Date(),
    details: `${action} performed`,
  };
}

describe('ReportService', () => {
  let repo: MockReportRepo;

  beforeEach(() => {
    repo = new MockReportRepo();
    repo.seedLog([
      makeEntry('e1', 'login', 'u1'),
      makeEntry('e2', 'campaign_create', 'u2'),
      makeEntry('e3', 'login', 'u2'),
    ]);
  });

  it('getActivityLog returns all entries when no filter', async () => {
    const svc = new ReportService(repo);
    const entries = await svc.getActivityLog({});
    expect(entries).toHaveLength(3);
  });

  it('getActivityLog filters by action', async () => {
    const svc = new ReportService(repo);
    const entries = await svc.getActivityLog({ action: 'login' });
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.action === 'login')).toBe(true);
  });

  it('getActivityLog filters by userId', async () => {
    const svc = new ReportService(repo);
    const entries = await svc.getActivityLog({ userId: 'u1' });
    expect(entries).toHaveLength(1);
    expect(entries[0]!.actorId).toBe('u1');
  });

  it('generateReport creates a report with type and data', async () => {
    const svc = new ReportService(repo);
    const report = await svc.generateReport('performance', { clientId: 'client-a' });
    expect(report.type).toBe('performance');
    expect(report.id).toBeDefined();
    expect(report.generatedAt).toBeInstanceOf(Date);
  });

  it('scheduleReport persists the config to the repository', async () => {
    const svc = new ReportService(repo);
    const config: ScheduleReportConfig = {
      type: 'performance',
      frequency: 'weekly',
      filters: { clientId: 'client-a' },
    };
    await svc.scheduleReport(config);
    expect(repo.getScheduled()).toHaveLength(1);
    expect(repo.getScheduled()[0]!.type).toBe('performance');
  });

  it('getReportHistory returns all generated reports', async () => {
    const svc = new ReportService(repo);
    await svc.generateReport('performance', {});
    await svc.generateReport('financial', {});
    const history = await svc.getReportHistory();
    expect(history).toHaveLength(2);
    expect(history.map((r) => r.type)).toContain('performance');
    expect(history.map((r) => r!.type)).toContain('financial');
  });
});