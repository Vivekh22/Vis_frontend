/**
 * MockThirdPartyStatusRepository.ts — repositories/mocks/
 */
import type { ThirdPartyServiceStatus, ThirdPartyStatusRepository } from '../../services/ThirdPartyStatusService';

export class MockThirdPartyStatusRepository implements ThirdPartyStatusRepository {
  private readonly services: ThirdPartyServiceStatus[] = [
    { id: 'tps-1', serviceName: 'Stripe', category: 'Payment Gateway', status: 'operational', lastIncident: null, uptimePercent: 99.98 },
    { id: 'tps-2', serviceName: 'Sift', category: 'Fraud Detection', status: 'operational', lastIncident: new Date('2026-07-22'), uptimePercent: 99.9 },
    { id: 'tps-3', serviceName: 'SendGrid', category: 'Email Delivery', status: 'degraded', lastIncident: new Date('2026-08-13'), uptimePercent: 98.5 },
    { id: 'tps-4', serviceName: 'Twilio', category: 'SMS Delivery', status: 'operational', lastIncident: null, uptimePercent: 99.95 },
    { id: 'tps-5', serviceName: 'AWS S3', category: 'Asset Storage', status: 'operational', lastIncident: null, uptimePercent: 99.99 },
  ];

  async getAllStatuses(): Promise<ThirdPartyServiceStatus[]> {
    return [...this.services];
  }
}