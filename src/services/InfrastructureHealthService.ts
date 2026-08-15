/**
 * InfrastructureHealthService.ts — services/
 *
 * API latency, error rates, database health, queue sizes, uptime.
 * Standard ops dashboard — mock-backed.
 */
export interface InfrastructureMetric {
  readonly id: string;
  readonly metricName: string;
  readonly currentValue: number;
  readonly unit: string;
  readonly threshold: number;
  readonly status: 'healthy' | 'warning' | 'critical';
  readonly trendData: { label: string; value: number }[];
}

export interface InfrastructureHealthRepository {
  getMetrics(): Promise<InfrastructureMetric[]>;
}

export class InfrastructureHealthService {
  constructor(private readonly repo: InfrastructureHealthRepository) {}

  async getMetrics(): Promise<InfrastructureMetric[]> {
    return this.repo.getMetrics();
  }
}