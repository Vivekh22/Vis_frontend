/**
 * CampaignService.ts — services/
 *
 * Purpose:
 *   Orchestrates campaign CRUD and approval-flow-aware operations. Each
 *   method delegates state transitions to the Campaign entity's own state
 *   machine (from Part 3) rather than reimplementing transition logic here.
 *
 *   duplicateCampaign() correctly resets status: the duplicate starts at
 *   draft and is immediately submitted for approval (re-entering Pending
 *   Approval), never inheriting the original's running status — per the
 *   Client UI spec's explicit note.
 */
import { Campaign } from '../core/entities/Campaign';
import { CampaignStatus } from '../core/enums/CampaignStatus';
import type { OptimizationGoal } from '../core/enums/OptimizationGoal';
import { Money } from '../core/value-objects/Money';
import { DomainError } from '../core/errors/DomainError';
import { authStore } from '../platform/state/AuthStore';

export interface CampaignFilter {
  clientId?: string;
  status?: CampaignStatus;
}

export interface CampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  findAll(filter?: CampaignFilter): Promise<Campaign[]>;
  save(campaign: Campaign): Promise<Campaign>;
  delete(id: string): Promise<void>;
}

export interface CampaignCreateData {
  name: string;
  clientId: string;
  budget: Money;
  optimizationGoal: OptimizationGoal;
  startDate: Date;
  endDate: Date;
}

export interface CampaignUpdateData {
  name?: string;
  budget?: Money;
  optimizationGoal?: OptimizationGoal;
  startDate?: Date;
  endDate?: Date;
}

export type BulkAction = 'pause' | 'resume' | 'archive';

export interface BulkUpdateResult {
  succeeded: string[];
  failed: { id: string; error: string }[];
}

export class CampaignService {
  constructor(private readonly campaignRepo: CampaignRepository) {}

  async createCampaign(data: CampaignCreateData): Promise<Campaign> {
    const campaign = new Campaign(
      this.generateId('camp'),
      data.name,
      data.clientId,
      data.budget,
      data.optimizationGoal,
      data.startDate,
      data.endDate,
    );
    return await this.campaignRepo.save(campaign);
  }

  async updateCampaign(campaignId: string, changes: CampaignUpdateData): Promise<Campaign> {
    const existing = await this.campaignRepo.findById(campaignId);
    if (!existing) {
      throw new DomainError(`Campaign not found: ${campaignId}`);
    }
    const updated = new Campaign(
      existing.id,
      changes.name ?? existing.name,
      existing.clientId,
      changes.budget ?? existing.getBudget(),
      changes.optimizationGoal ?? existing.getOptimizationGoal(),
      changes.startDate ?? existing.startDate,
      changes.endDate ?? existing.endDate,
      existing.status,
      existing.createdAt,
    );
    return await this.campaignRepo.save(updated);
  }

  async listCampaigns(filter?: CampaignFilter): Promise<Campaign[]> {
    return await this.campaignRepo.findAll(filter);
  }

  async submitForApproval(campaignId: string, note?: string): Promise<Campaign> {
    const campaign = await this.campaignRepo.findById(campaignId);
    if (!campaign) {
      throw new DomainError(`Campaign not found: ${campaignId}`);
    }
    const { actorId, actorName } = this.getActor();
    campaign.submitForApproval(actorId, actorName, note);
    return await this.campaignRepo.save(campaign);
  }

  async duplicateCampaign(campaignId: string): Promise<Campaign> {
    const original = await this.campaignRepo.findById(campaignId);
    if (!original) {
      throw new DomainError(`Campaign not found: ${campaignId}`);
    }
    const { actorId, actorName } = this.getActor();
    const duplicate = new Campaign(
      this.generateId('camp'),
      `Copy of ${original.name}`,
      original.clientId,
      original.getBudget(),
      original.getOptimizationGoal(),
      original.startDate,
      original.endDate,
    );
    duplicate.submitForApproval(actorId, actorName);
    return await this.campaignRepo.save(duplicate);
  }

  /**
   * Bulk status update — PARTIAL SUCCESS model.
   *
   * Decision: when one campaign in the batch has an invalid transition
   * (e.g. trying to pause an already-archived campaign), the valid ones
   * succeed while invalid ones are reported separately. The method returns
   * a BulkUpdateResult with succeeded and failed arrays — it does NOT
   * throw. This is the user-friendlier choice: failing all 50 campaigns
   * because one is in an invalid state would be frustrating.
   *
   * The caller (UI) is responsible for surfacing both lists to the user.
   *
   * Campaign state-machine rules from Part 3:
   *   draft → pending_approval → running → paused → archived
   *   running → paused, paused → running
   *   Each transition is validated by Campaign.transitionStatus().
   */
  async bulkUpdateStatus(
    campaignIds: string[],
    action: BulkAction,
  ): Promise<BulkUpdateResult> {
    const { actorId, actorName } = this.getActor();
    const succeeded: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const id of campaignIds) {
      try {
        const campaign = await this.campaignRepo.findById(id);
        if (!campaign) {
          failed.push({ id, error: 'Campaign not found' });
          continue;
        }
        const targetStatus = this.mapBulkActionToStatus(action, campaign.status);
        campaign.transitionStatus(targetStatus, actorId, actorName);
        await this.campaignRepo.save(campaign);
        succeeded.push(id);
      } catch (err) {
        failed.push({ id, error: err instanceof Error ? err.message : String(err) });
      }
    }

    return { succeeded, failed };
  }

  private mapBulkActionToStatus(
    action: BulkAction,
    _currentStatus: CampaignStatus,
  ): CampaignStatus {
    switch (action) {
      case 'pause':
        return CampaignStatus.Paused;
      case 'resume':
        return CampaignStatus.Running;
      case 'archive':
        return CampaignStatus.Archived;
      default:
        throw new DomainError(`Unknown bulk action: ${action as string}`);
    }
  }

  private getActor(): { actorId: string; actorName: string } {
    const user = authStore.getState().currentUser;
    return {
      actorId: user?.id ?? 'system',
      actorName: user?.fullName ?? 'System',
    };
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}