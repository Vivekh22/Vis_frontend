/**
 * FraudSecurityService.ts — services/
 *
 * Platform-wide fraud/IVT rate trends, blocklist size + recent additions,
 * security incident log. Distinct from any single client's fraud flag
 * (Admin Accounts page, Part 11) — this is the aggregate view.
 */
export interface FraudSecurityIncident {
  readonly id: string;
  readonly type: string;
  readonly severity: 'low' | 'medium' | 'high';
  readonly description: string;
  readonly detectedAt: Date;
  readonly status: 'open' | 'investigating' | 'resolved';
}

export interface FraudSecuritySummary {
  readonly ivtRateTrend: { label: string; value: number }[];
  readonly blocklistSize: number;
  readonly recentBlocklistAdditions: { ip: string; reason: string; addedAt: Date }[];
  readonly incidents: FraudSecurityIncident[];
}

export interface FraudSecurityRepository {
  getSummary(): Promise<FraudSecuritySummary>;
}

export class FraudSecurityService {
  constructor(private readonly repo: FraudSecurityRepository) {}

  async getSummary(): Promise<FraudSecuritySummary> {
    return this.repo.getSummary();
  }
}