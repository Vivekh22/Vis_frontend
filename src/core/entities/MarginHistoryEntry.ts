/**
 * MarginHistoryEntry.ts — core/entities/
 *
 * An audit-trail entry for a margin change. Records the old value, new
 * value, who changed it, and the mandatory note explaining why.
 *
 * Margin changes are FORWARD-LOOKING ONLY — they never affect already-
 * billed periods. This entity records what changed and when, but the
 * enforcement of forward-looking-only is in the service/repository layer.
 */
import { Percentage } from '../value-objects/Percentage';

export class MarginHistoryEntry {
  constructor(
    public readonly id: string,
    public readonly clientId: string,
    public readonly field: string,
    public readonly oldValue: Percentage,
    public readonly newValue: Percentage,
    public readonly changedBy: string,
    public readonly note: string,
    public readonly changedAt: Date = new Date(),
  ) {}
}