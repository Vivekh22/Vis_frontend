/**
 * ModelManagementService.ts — services/
 *
 * Manages deployed Taranga models — model_version, deployment status,
 * last-retrained date, drift-alert status, rollback to a previous version.
 *
 * Model names match Taranga's own locked structure (pctr, pcvr, ltv, etc.)
 * for consistency even though no real Taranga connection exists yet.
 *
 * ROLLBACK:
 *   Rollback is a consequential production action — the service method
 *   accepts a mandatory note (enforced by MandatoryNoteDialogElement in
 *   the UI). The underlying call is mocked but the UI flow is real.
 */
export type ModelDeploymentStatus = 'deployed' | 'canary' | 'idle' | 'failed';
export type DriftAlertStatus = 'none' | 'warning' | 'critical';

export interface ModelVersion {
  readonly version: string;
  readonly deployedAt: Date;
  readonly isCurrent: boolean;
}

export interface ModelDeployment {
  readonly id: string;
  readonly modelName: string;
  readonly currentVersion: string;
  readonly status: ModelDeploymentStatus;
  readonly lastRetrained: Date;
  readonly driftAlert: DriftAlertStatus;
  readonly versionHistory: ModelVersion[];
}

export interface ModelManagementRepository {
  getModels(): Promise<ModelDeployment[]>;
  rollbackModel(modelId: string, targetVersion: string, note: string): Promise<void>;
}

export class ModelManagementService {
  constructor(private readonly repo: ModelManagementRepository) {}

  async getModels(): Promise<ModelDeployment[]> {
    return this.repo.getModels();
  }

  async rollbackModel(modelId: string, targetVersion: string, note: string): Promise<void> {
    if (!note || note.length < 10) {
      throw new Error('Rollback requires a mandatory note (minimum 10 characters).');
    }
    await this.repo.rollbackModel(modelId, targetVersion, note);
  }
}