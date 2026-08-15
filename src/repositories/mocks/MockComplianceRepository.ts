/**
 * MockComplianceRepository.ts — repositories/mocks/
 */
import type {
  ComplianceRegulation,
  ConsentStats,
  DsarRequest,
  ComplianceRepository,
} from '../../services/ComplianceService';

export class MockComplianceRepository implements ComplianceRepository {
  private readonly regulations: ComplianceRegulation[] = [
    { id: 'reg-1', name: 'GDPR', status: 'compliant', lastAudit: new Date('2026-06-01'), notes: 'Annual audit passed.' },
    { id: 'reg-2', name: 'DPDP (India)', status: 'action_needed', lastAudit: new Date('2026-07-15'), notes: 'Consent flow update pending.' },
    { id: 'reg-3', name: 'COPPA', status: 'compliant', lastAudit: new Date('2026-05-20'), notes: 'Age-gating verified.' },
    { id: 'reg-4', name: 'CCPA/CPRA', status: 'compliant', lastAudit: new Date('2026-06-10'), notes: 'No issues.' },
    { id: 'reg-5', name: 'LGPD (Brazil)', status: 'non_compliant', lastAudit: new Date('2026-04-05'), notes: 'Data residency gap — remediation in progress.' },
  ];

  async getRegulations(): Promise<ComplianceRegulation[]> {
    return [...this.regulations];
  }

  async getConsentStats(): Promise<ConsentStats> {
    return { totalUsers: 48200, consentGranted: 39806, consentRate: 82.6 };
  }

  async getDsarQueue(): Promise<DsarRequest[]> {
    return [
      { id: 'dsar-1', requesterName: 'John Doe', requestType: 'Data Access', submittedAt: new Date('2026-08-01'), dueDate: new Date('2026-08-30'), status: 'in_progress' },
      { id: 'dsar-2', requesterName: 'Jane Smith', requestType: 'Data Deletion', submittedAt: new Date('2026-07-15'), dueDate: new Date('2026-08-14'), status: 'pending' },
      { id: 'dsar-3', requesterName: 'Bob Lee', requestType: 'Data Export', submittedAt: new Date('2026-08-05'), dueDate: new Date('2026-09-04'), status: 'pending' },
      { id: 'dsar-4', requesterName: 'Alice Wong', requestType: 'Data Correction', submittedAt: new Date('2026-07-20'), dueDate: new Date('2026-08-19'), status: 'completed' },
    ];
  }
}