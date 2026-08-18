/**
 * ComplianceService.ts — services/
 *
 * Regulatory status (GDPR, DPDP, COPPA, etc.), consent-management
 * statistics, and DSAR (Data Subject Access Request) queue with due-date
 * tracking.
 *
 * DSAR OVERDUE INDICATOR:
 *   Reuses the same non-color-alone overdue pattern established by
 *   ApprovalQueueElement in Part 2 — the overdue indicator includes
 *   both a color change AND a text label ("OVERDUE"), not color alone.
 */

// DESIGN NOTE: This service uses a mock repository by design — these are Super Admin
// monitoring/status/governance pages with no real backend API to call yet. When the
// backend is ready, swap the mock for a real repository in services/index.ts.
export type ComplianceRegulationStatus = 'compliant' | 'action_needed' | 'non_compliant';

export interface ComplianceRegulation {
  readonly id: string;
  readonly name: string;
  readonly status: ComplianceRegulationStatus;
  readonly lastAudit: Date;
  readonly notes: string;
}

export interface ConsentStats {
  readonly totalUsers: number;
  readonly consentGranted: number;
  readonly consentRate: number;
}

export interface DsarRequest {
  readonly id: string;
  readonly requesterName: string;
  readonly requestType: string;
  readonly submittedAt: Date;
  readonly dueDate: Date;
  readonly status: 'pending' | 'in_progress' | 'completed';
}

export interface ComplianceRepository {
  getRegulations(): Promise<ComplianceRegulation[]>;
  getConsentStats(): Promise<ConsentStats>;
  getDsarQueue(): Promise<DsarRequest[]>;
}

export class ComplianceService {
  constructor(private readonly repo: ComplianceRepository) {}

  async getRegulations(): Promise<ComplianceRegulation[]> {
    return this.repo.getRegulations();
  }

  async getConsentStats(): Promise<ConsentStats> {
    return this.repo.getConsentStats();
  }

  async getDsarQueue(): Promise<DsarRequest[]> {
    return this.repo.getDsarQueue();
  }

  /**
   * Determines if a DSAR request is overdue — same non-color-alone
   * pattern as ApprovalQueueElement: callers should display both the
   * red color AND the "OVERDUE" text label.
   */
  isOverdue(request: DsarRequest, now: Date = new Date()): boolean {
    return request.status !== 'completed' && request.dueDate.getTime() < now.getTime();
  }
}