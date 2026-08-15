/**
 * MockGeoEdgeRepository.ts — repositories/mocks/
 */
import type { EdgeNode, GeoEdgeRepository } from '../../services/GeoEdgeService';

export class MockGeoEdgeRepository implements GeoEdgeRepository {
  private readonly nodes: EdgeNode[] = [
    { id: 'edge-1', region: 'US-East', status: 'live', currentLatencyMs: 12, targetLatencyMs: 50 },
    { id: 'edge-2', region: 'US-West', status: 'live', currentLatencyMs: 18, targetLatencyMs: 50 },
    { id: 'edge-3', region: 'EU-West', status: 'live', currentLatencyMs: 22, targetLatencyMs: 50 },
    { id: 'edge-4', region: 'EU-Central', status: 'degraded', currentLatencyMs: 68, targetLatencyMs: 50 },
    { id: 'edge-5', region: 'Asia-Pacific', status: 'live', currentLatencyMs: 35, targetLatencyMs: 50 },
    { id: 'edge-6', region: 'South-America', status: 'down', currentLatencyMs: 0, targetLatencyMs: 50 },
  ];

  async getEdgeNodes(): Promise<EdgeNode[]> {
    return [...this.nodes];
  }
}