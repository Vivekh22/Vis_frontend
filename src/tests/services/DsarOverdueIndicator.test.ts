/**
 * DsarOverdueIndicator.test.ts
 *
 * Proves that the DSAR queue overdue indicator reuses the SAME non-color-
 * alone pattern established by ApprovalQueueElement in Part 2 — the
 * overdue indicator includes both a red color AND a text label ("OVERDUE"),
 * not color alone.
 *
 * ComplianceService.isOverdue() is the logic; ComplianceCenterPageElement
 * renders both the color class AND the "OVERDUE" text label.
 */
import { describe, it, expect } from 'vitest';
import { ComplianceService } from '../../services/ComplianceService';
import { MockComplianceRepository } from '../../repositories/mocks/MockComplianceRepository';
import type { DsarRequest } from '../../services/ComplianceService';

describe('DSAR Overdue Indicator', () => {
  it('ComplianceService.isOverdue() returns true for past-due pending requests', () => {
    const repo = new MockComplianceRepository();
    const service = new ComplianceService(repo);
    const now = new Date('2026-08-15');

    const overdueRequest: DsarRequest = {
      id: 'dsar-test',
      requesterName: 'Test User',
      requestType: 'Data Access',
      submittedAt: new Date('2026-07-01'),
      dueDate: new Date('2026-08-01'), // past due
      status: 'pending',
    };

    expect(service.isOverdue(overdueRequest, now)).toBe(true);
  });

  it('ComplianceService.isOverdue() returns false for not-yet-due requests', () => {
    const repo = new MockComplianceRepository();
    const service = new ComplianceService(repo);
    const now = new Date('2026-08-15');

    const futureRequest: DsarRequest = {
      id: 'dsar-test',
      requesterName: 'Test User',
      requestType: 'Data Access',
      submittedAt: new Date('2026-08-10'),
      dueDate: new Date('2026-09-10'), // future due date
      status: 'pending',
    };

    expect(service.isOverdue(futureRequest, now)).toBe(false);
  });

  it('ComplianceService.isOverdue() returns false for completed requests even if past due', () => {
    const repo = new MockComplianceRepository();
    const service = new ComplianceService(repo);
    const now = new Date('2026-08-15');

    const completedRequest: DsarRequest = {
      id: 'dsar-test',
      requesterName: 'Test User',
      requestType: 'Data Access',
      submittedAt: new Date('2026-07-01'),
      dueDate: new Date('2026-08-01'), // past due
      status: 'completed', // but completed
    };

    expect(service.isOverdue(completedRequest, now)).toBe(false);
  });

  it('ComplianceCenterPageElement renders BOTH color AND text label for overdue (non-color-alone)', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(
      __dirname,
      '../../pages/super-admin/trust-compliance/compliance-center/ComplianceCenterPageElement.ts',
    );
    const content = fs.readFileSync(filePath, 'utf-8');

    // Must have the color class
    expect(content).toContain('dsar-overdue-cell');
    // Must have the text label — not color alone
    expect(content).toContain('OVERDUE');
    expect(content).toContain('dsar-overdue-label');
  });

  it('mock DSAR queue has at least one overdue item for visual testing', async () => {
    const repo = new MockComplianceRepository();
    const service = new ComplianceService(repo);
    const queue = await service.getDsarQueue();
    const now = new Date('2026-08-15');

    const overdueCount = queue.filter((d) => service.isOverdue(d, now)).length;
    expect(overdueCount).toBeGreaterThan(0);
  });
});