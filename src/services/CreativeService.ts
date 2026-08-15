/**
 * CreativeService.ts — services/
 *
 * Purpose:
 *   Same CRUD/approval-orchestration pattern as CampaignService, adapted
 *   for Creative entities.
 *
 *   submitCreativeEdit() reflects the spec's specific rule that editing a
 *   LIVE creative doesn't immediately replace what's serving: it creates a
 *   SEPARATE pending version rather than mutating the live one in place,
 *   matching the spec's "both states clearly labeled during this window"
 *   behavior. The original creative remains active/serving while the edited
 *   version goes through the approval workflow.
 */
import { Creative } from '../core/entities/Creative';
import type { CreativeStatus } from '../core/enums/CreativeStatus';
import { DomainError } from '../core/errors/DomainError';
import { authStore } from '../platform/state/AuthStore';

export interface CreativeFilter {
  campaignId?: string;
  status?: CreativeStatus;
}

export interface CreativeRepository {
  findById(id: string): Promise<Creative | null>;
  findAll(filter?: CreativeFilter): Promise<Creative[]>;
  save(creative: Creative): Promise<Creative>;
  delete(id: string): Promise<void>;
}

export interface CreativeCreateData {
  name: string;
  campaignId: string;
  format: string;
  assetUrl: string;
}

export interface CreativeUpdateData {
  name?: string;
  format?: string;
  assetUrl?: string;
}

export class CreativeService {
  constructor(private readonly creativeRepo: CreativeRepository) {}

  async createCreative(data: CreativeCreateData): Promise<Creative> {
    const creative = new Creative(
      this.generateId('cr'),
      data.name,
      data.campaignId,
      data.format,
      data.assetUrl,
    );
    return await this.creativeRepo.save(creative);
  }

  async updateCreative(creativeId: string, changes: CreativeUpdateData): Promise<Creative> {
    const existing = await this.creativeRepo.findById(creativeId);
    if (!existing) {
      throw new DomainError(`Creative not found: ${creativeId}`);
    }
    const updated = new Creative(
      existing.id,
      changes.name ?? existing.name,
      existing.campaignId,
      changes.format ?? existing.format,
      changes.assetUrl ?? existing.assetUrl,
      existing.status,
      existing.createdAt,
    );
    return await this.creativeRepo.save(updated);
  }

  async listCreatives(filter?: CreativeFilter): Promise<Creative[]> {
    return await this.creativeRepo.findAll(filter);
  }

  async deleteCreative(creativeId: string): Promise<void> {
    await this.creativeRepo.delete(creativeId);
  }

  async submitForApproval(creativeId: string, note?: string): Promise<Creative> {
    const creative = await this.creativeRepo.findById(creativeId);
    if (!creative) {
      throw new DomainError(`Creative not found: ${creativeId}`);
    }
    const { actorId, actorName } = this.getActor();
    creative.submitForApproval(actorId, actorName, note);
    return await this.creativeRepo.save(creative);
  }

  async submitCreativeEdit(creativeId: string, changes: CreativeUpdateData): Promise<Creative> {
    const original = await this.creativeRepo.findById(creativeId);
    if (!original) {
      throw new DomainError(`Creative not found: ${creativeId}`);
    }
    const { actorId, actorName } = this.getActor();
    const edited = new Creative(
      this.generateId('cr'),
      changes.name ?? original.name,
      original.campaignId,
      changes.format ?? original.format,
      changes.assetUrl ?? original.assetUrl,
    );
    edited.submitForApproval(actorId, actorName);
    return await this.creativeRepo.save(edited);
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