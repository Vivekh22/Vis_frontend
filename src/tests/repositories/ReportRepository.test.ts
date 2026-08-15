/**
 * ReportRepository.test.ts — tests for repositories/ReportRepository.
 *
 * Tests correct endpoints called, DTO → ActivityLogEntry/Report mapping
 * (ISO date string → Date), and filter query params.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from '../../repositories/ApiClient';
import { ReportRepository } from '../../repositories/ReportRepository';

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('ReportRepository', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('getActivityLog calls GET /api/reports/activity-log with filter params', async () => {
    fetchSpy.mockResolvedValue(mockResponse([]));
    const repo = new ReportRepository(new ApiClient('https://api.test'));
    await repo.getActivityLog({ userId: 'u1', action: 'login' });

    const [url] = fetchSpy.mock.calls[0]!;
    expect(url).toContain('/api/reports/activity-log');
    expect(url).toContain('userId=u1');
    expect(url).toContain('action=login');
  });

  it('getActivityLog maps DTO to entries with Date conversion', async () => {
    fetchSpy.mockResolvedValue(mockResponse([
      { id: 'e1', action: 'login', actorId: 'u1', actorName: 'User One', timestamp: '2026-08-15T10:00:00.000Z', details: 'login from web' },
    ]));
    const repo = new ReportRepository(new ApiClient('https://api.test'));
    const entries = await repo.getActivityLog({});

    expect(entries).toHaveLength(1);
    expect(entries[0]!.actorName).toBe('User One');
    expect(entries[0]!.timestamp).toBeInstanceOf(Date);
    expect(entries[0]!.timestamp.toISOString()).toBe('2026-08-15T10:00:00.000Z');
  });

  it('generateReport calls POST /api/reports/generate', async () => {
    fetchSpy.mockResolvedValue(mockResponse({
      id: 'rpt-1', type: 'performance', generatedAt: '2026-08-15T10:00:00.000Z', data: { kpi: 100 },
    }));
    const repo = new ReportRepository(new ApiClient('https://api.test'));
    const report = await repo.generateReport('performance', { clientId: 'client-a' });

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/reports/generate');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(body.type).toBe('performance');
    expect(report.id).toBe('rpt-1');
    expect(report.generatedAt).toBeInstanceOf(Date);
  });

  it('scheduleReport calls POST /api/reports/schedule', async () => {
    fetchSpy.mockResolvedValue(mockResponse(null, 204));
    const repo = new ReportRepository(new ApiClient('https://api.test'));
    await repo.scheduleReport({
      type: 'performance',
      frequency: 'weekly',
      filters: { clientId: 'client-a' },
    });

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/reports/schedule');
    const body = JSON.parse(init.body);
    expect(body.frequency).toBe('weekly');
  });

  it('getReportHistory calls GET /api/reports/history', async () => {
    fetchSpy.mockResolvedValue(mockResponse([
      { id: 'rpt-1', type: 'performance', generatedAt: '2026-08-15T10:00:00.000Z', data: {} },
    ]));
    const repo = new ReportRepository(new ApiClient('https://api.test'));
    const reports = await repo.getReportHistory();

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://api.test/api/reports/history');
    expect(init.method).toBe('GET');
    expect(reports).toHaveLength(1);
    expect(reports[0]!.type).toBe('performance');
  });
});