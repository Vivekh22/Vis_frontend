/**
 * MockModelManagementRepository.ts — repositories/mocks/
 *
 * Mock-backed model deployments. Model names match Taranga's locked
 * structure (pctr, pcvr, ltv, etc.) for consistency.
 */
import type { ModelDeployment, ModelManagementRepository } from '../../services/ModelManagementService';

export class MockModelManagementRepository implements ModelManagementRepository {
  private models: ModelDeployment[] = [
    {
      id: 'model-1', modelName: 'pctr', currentVersion: 'v3.2.1', status: 'deployed',
      lastRetrained: new Date('2026-07-15'), driftAlert: 'none',
      versionHistory: [
        { version: 'v3.2.1', deployedAt: new Date('2026-07-15'), isCurrent: true },
        { version: 'v3.2.0', deployedAt: new Date('2026-06-20'), isCurrent: false },
        { version: 'v3.1.0', deployedAt: new Date('2026-05-10'), isCurrent: false },
      ],
    },
    {
      id: 'model-2', modelName: 'pcvr', currentVersion: 'v2.0.3', status: 'deployed',
      lastRetrained: new Date('2026-08-01'), driftAlert: 'warning',
      versionHistory: [
        { version: 'v2.0.3', deployedAt: new Date('2026-08-01'), isCurrent: true },
        { version: 'v2.0.2', deployedAt: new Date('2026-07-05'), isCurrent: false },
      ],
    },
    {
      id: 'model-3', modelName: 'ltv', currentVersion: 'v1.5.0', status: 'canary',
      lastRetrained: new Date('2026-08-10'), driftAlert: 'none',
      versionHistory: [
        { version: 'v1.5.0', deployedAt: new Date('2026-08-10'), isCurrent: true },
        { version: 'v1.4.2', deployedAt: new Date('2026-06-28'), isCurrent: false },
      ],
    },
    {
      id: 'model-4', modelName: 'bid_optimization', currentVersion: 'v4.1.0', status: 'deployed',
      lastRetrained: new Date('2026-07-30'), driftAlert: 'critical',
      versionHistory: [
        { version: 'v4.1.0', deployedAt: new Date('2026-07-30'), isCurrent: true },
        { version: 'v4.0.0', deployedAt: new Date('2026-06-15'), isCurrent: false },
        { version: 'v3.3.0', deployedAt: new Date('2026-05-01'), isCurrent: false },
      ],
    },
  ];

  async getModels(): Promise<ModelDeployment[]> {
    return [...this.models];
  }

  async rollbackModel(modelId: string, targetVersion: string, _note: string): Promise<void> {
    const idx = this.models.findIndex((m) => m.id === modelId);
    if (idx === -1) return;
    const model = this.models[idx]!;
    const versions = model.versionHistory.map((v) => ({ ...v, isCurrent: v.version === targetVersion }));
    const mutable = this.models as {
      id: string;
      currentVersion: string;
      versionHistory: { version: string; deployedAt: Date; isCurrent: boolean }[];
    }[];
    mutable[idx]!.currentVersion = targetVersion;
    mutable[idx]!.versionHistory = versions;
  }
}