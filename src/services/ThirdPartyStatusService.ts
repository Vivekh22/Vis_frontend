/**
 * ThirdPartyStatusService.ts — services/
 *
 * Simple status-per-service list for payment gateway, fraud-detection
 * vendor, email/SMS delivery. Read-heavy monitoring view — mock-backed.
 */

// DESIGN NOTE: This service uses a mock repository by design — these are Super Admin
// monitoring/status/governance pages with no real backend API to call yet. When the
// backend is ready, swap the mock for a real repository in services/index.ts.
export interface ThirdPartyServiceStatus {
  readonly id: string;
  readonly serviceName: string;
  readonly category: string;
  readonly status: 'operational' | 'degraded' | 'down';
  readonly lastIncident: Date | null;
  readonly uptimePercent: number;
}

export interface ThirdPartyStatusRepository {
  getAllStatuses(): Promise<ThirdPartyServiceStatus[]>;
}

export class ThirdPartyStatusService {
  constructor(private readonly repo: ThirdPartyStatusRepository) {}

  async getAllStatuses(): Promise<ThirdPartyServiceStatus[]> {
    return this.repo.getAllStatuses();
  }
}