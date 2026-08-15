/**
 * Campaign.ts — core/entities/
 *
 * The core domain entity for advertising campaigns. Implements IApprovable
 * (campaigns go through the approval workflow) and IAuditable (all changes
 * are logged to an append-only audit trail).
 *
 * State machine:
 *   Campaign status transitions are governed by an explicit allowed-
 *   transitions map. Invalid transitions (e.g. draft → running without
 *   passing through pending_approval) throw a DomainError. This prevents
 *   the entity from entering an inconsistent state regardless of what the
 *   UI attempts.
 *
 *   draft → pending_approval → running → paused → archived
 *                           ↘ rejected ↗
 *   running → paused, paused → running
 *   rejected → pending_approval (resubmit)
 */
import type { CampaignStatus } from '../enums/CampaignStatus';
import type { OptimizationGoal } from '../enums/OptimizationGoal';
import type { IApprovable, ApprovalHistoryEntry } from '../interfaces/IApprovable';
import type { IAuditable, AuditEntry } from '../interfaces/IAuditable';
import { DomainError } from '../errors/DomainError';
import { Money } from '../value-objects/Money';

const CAMPAIGN_TRANSITIONS: Readonly<Record<CampaignStatus, readonly CampaignStatus[]>> = {
  draft: ['pending_approval', 'archived'],
  pending_approval: ['running', 'rejected', 'archived'],
  running: ['paused', 'archived'],
  paused: ['running', 'archived'],
  rejected: ['pending_approval', 'archived'],
  archived: [],
};

export class Campaign implements IApprovable, IAuditable {
  private _status: CampaignStatus;
  private _submittedAt: Date | null = null;
  private _submittedBy: string | null = null;
  private readonly _approvalHistory: ApprovalHistoryEntry[] = [];
  private readonly _auditHistory: AuditEntry[] = [];

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly clientId: string,
    private readonly budget: Money,
    private readonly optimizationGoal: OptimizationGoal,
    public readonly startDate: Date,
    public readonly endDate: Date,
    status: CampaignStatus = 'draft',
    public readonly createdAt: Date = new Date(),
  ) {
    this._status = status;
  }

  public get status(): CampaignStatus {
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

  public getBudget(): Money {
    return this.budget;
  }

  public getOptimizationGoal(): OptimizationGoal {
    return this.optimizationGoal;
  }

  /**
   * Transitions the campaign to a new status. Throws DomainError if the
   * transition is not in the allowed-transitions map.
   */
  public transitionStatus(newStatus: CampaignStatus, actorId: string, actorName: string, note: string | null = null): void {
    const allowed = CAMPAIGN_TRANSITIONS[this._status];
    if (!allowed.includes(newStatus)) {
      throw new DomainError(
        `Invalid campaign status transition: ${this._status} → ${newStatus}`,
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
    this._auditHistory.push({
      action: `status_transition:${fromStatus}→${newStatus}`,
      actorId,
      actorName,
      timestamp: new Date(),
      note,
    });
  }

  // Convenience methods for common transitions
  public submitForApproval(actorId: string, actorName: string, note?: string): void {
    this.transitionStatus('pending_approval', actorId, actorName, note);
  }

  public approve(actorId: string, actorName: string, note?: string): void {
    this.transitionStatus('running', actorId, actorName, note);
  }

  public reject(actorId: string, actorName: string, note?: string): void {
    this.transitionStatus('rejected', actorId, actorName, note);
  }

  public pause(actorId: string, actorName: string, note?: string): void {
    this.transitionStatus('paused', actorId, actorName, note);
  }

  public resume(actorId: string, actorName: string, note?: string): void {
    this.transitionStatus('running', actorId, actorName, note);
  }

  public archive(actorId: string, actorName: string, note?: string): void {
    this.transitionStatus('archived', actorId, actorName, note);
  }

  public getHistory(): AuditEntry[] {
    return [...this._auditHistory];
  }
}