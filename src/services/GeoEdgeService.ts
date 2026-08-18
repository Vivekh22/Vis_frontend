/**
 * GeoEdgeService.ts — services/
 *
 * Per-region status of edge-serving nodes and current latency vs. a
 * target threshold. The threshold is CONFIGURATION (read from
 * PlatformSettings), not hardcoded in the display component.
 */

// DESIGN NOTE: This service uses a mock repository by design — these are Super Admin
// monitoring/status/governance pages with no real backend API to call yet. When the
// backend is ready, swap the mock for a real repository in services/index.ts.
export type EdgeNodeStatus = 'live' | 'degraded' | 'down';

export interface EdgeNode {
  readonly id: string;
  readonly region: string;
  readonly status: EdgeNodeStatus;
  readonly currentLatencyMs: number;
  readonly targetLatencyMs: number;
}

export interface GeoEdgeRepository {
  getEdgeNodes(): Promise<EdgeNode[]>;
}

export class GeoEdgeService {
  constructor(private readonly repo: GeoEdgeRepository) {}

  async getEdgeNodes(): Promise<EdgeNode[]> {
    return this.repo.getEdgeNodes();
  }
}