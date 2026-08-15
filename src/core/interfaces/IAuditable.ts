/**
 * IAuditable.ts — core/interfaces/
 *
 * Interface for entities that maintain an audit trail of all changes.
 * The audit history is append-only — entries are never modified or deleted.
 */
export interface AuditEntry {
  readonly action: string;
  readonly actorId: string;
  readonly actorName: string;
  readonly timestamp: Date;
  readonly note: string | null;
}

export interface IAuditable {
  getHistory(): AuditEntry[];
}