/**
 * MockInfrastructureHealthRepository.ts — repositories/mocks/
 */
import type { InfrastructureMetric, InfrastructureHealthRepository } from '../../services/InfrastructureHealthService';

function genTrend(base: number, variance: number): { label: string; value: number }[] {
  return ['00h', '04h', '08h', '12h', '16h', '20h'].map((label) => ({
    label,
    value: Math.round((base + (Math.random() * variance * 2 - variance)) * 100) / 100,
  }));
}

export class MockInfrastructureHealthRepository implements InfrastructureHealthRepository {
  private readonly metrics: InfrastructureMetric[] = [
    { id: 'inf-1', metricName: 'API Latency (p95)', currentValue: 142, unit: 'ms', threshold: 200, status: 'healthy', trendData: genTrend(140, 20) },
    { id: 'inf-2', metricName: 'Error Rate', currentValue: 0.42, unit: '%', threshold: 1.0, status: 'healthy', trendData: genTrend(0.4, 0.2) },
    { id: 'inf-3', metricName: 'DB Query Latency', currentValue: 28, unit: 'ms', threshold: 50, status: 'healthy', trendData: genTrend(25, 10) },
    { id: 'inf-4', metricName: 'Queue Size', currentValue: 320, unit: 'msgs', threshold: 500, status: 'healthy', trendData: genTrend(300, 100) },
    { id: 'inf-5', metricName: 'Uptime (30d)', currentValue: 99.94, unit: '%', threshold: 99.9, status: 'healthy', trendData: genTrend(99.9, 0.1) },
  ];

  async getMetrics(): Promise<InfrastructureMetric[]> {
    return [...this.metrics];
  }
}