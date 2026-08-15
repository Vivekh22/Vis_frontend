/**
 * Creative.ts — core/entities/
 *
 * An advertising creative (image, video, HTML5 banner) attached to a
 * campaign. Implements IApprovable — creatives go through the same
 * approval workflow as campaigns.
 */
import type { CreativeStatus } from '../enums/CreativeStatus';
import type { IApprovable, ApprovalHistoryEntry } from '../interfaces/IApprovable';
import { DomainError } from '../errors/DomainError';

const CREATIVE_TRANSITIONS: Readonly<Record<CreativeStatus, readonly CreativeStatus[]>> = {
  draft: ['pending_approval'],
  pending_approval: ['active', 'rejected'],
  active: ['paused'],
  paused: ['active'],
  rejected: ['pending_approval'],
};

export class Creative implements IApprovable {
  private _status: CreativeStatus;
  private _submittedAt: Date | null = null;
  private _submittedBy: string | null = null;
  private readonly _approvalHistory: ApprovalHistoryEntry[] = [];

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly campaignId: string,
    public readonly format: string,
    public readonly assetUrl: string,
    status: CreativeStatus = 'draft',
    public readonly createdAt: Date = new Date(),
  ) {
    this._status = status;
  }

  public get status(): CreativeStatus {
    return this._status;
  }

  public get submittedAt(): Date | null {
    return this._submittedAt;
  }

  public get submittedBy(): string | null {
    return this._submittedBy;
  }

  public get approvalHistory(): ApprovalHistoryEntry[] {
    return [...this._approvalHistory];
  }

  public transitionStatus(newStatus: CreativeStatus, actorId: string, actorName: string, note: string | null = null): void {
    const allowed = CREATIVE_TRANSITIONS[this._status];
    if (!allowed.includes(newStatus)) {
      throw new DomainError(
        `Invalid creative status transition: ${this._status} → ${newStatus}`,
      );
    }
    const fromStatus = this._status;
    this._status = newStatus;

    if (newStatus === 'pending_approval') {
      this._submittedAt = new Date();
      this._submittedBy = actorId;
    }

    this._approvalHistory.push({
      action: 'status_transition',
      actorId,
      actorName,
      timestamp: new Date(),
      note,
      fromStatus,
      toStatus: newStatus,
    });
  }

  public submitForApproval(actorId: string, actorName: string, note?: string): void {
    this.transitionStatus('pending_approval', actorId, actorName, note);
  }

  public approve(actorId: string, actorName: string, note?: string): void {
    this.transitionStatus('active', actorId, actorName, note);
  }

  public reject(actorId: string, actorName: string, note?: string): void {
    this.transitionStatus('rejected', actorId, actorName, note);
  }

  public pause(actorId: string, actorName: string, note?: string): void {
    this.transitionStatus('paused', actorId, actorName, note);
  }

  public resume(actorId: string, actorName: string, note?: string): void {
    this.transitionStatus('active', actorId, actorName, note);
  }
}