/**
 * MarginService.ts — services/
 *
 * Manages per-client margin configuration. Margin changes are
 * FORWARD-LOOKING ONLY — they never affect already-billed periods.
 * The service enforces this by recording the effective date of each
 * change and rejecting attempts to apply a margin change to a past
 * billing period.
 *
 * !!! NEVER DELEGABLE !!!
 * Margin management is a Super Admin-only control. No PermissionGrant
 * can delegate margin management to Admins. The Role & Permission
 * Builder's grid has this row permanently greyed out.
 *
 * !!! MARGIN DISPLAY !!!
 * The ONLY place margin is ever displayed in the frontend is the
 * Super Admin Overview page's Platform Revenue card. No other page,
 * service, or component requests or displays margin data.
 */

// DESIGN NOTE: This service uses a mock repository by design — these are Super Admin
// monitoring/status/governance pages with no real backend API to call yet. When the
// backend is ready, swap the mock for a real repository in services/index.ts.
import { Percentage } from '../core/value-objects/Percentage';
import { MarginHistoryEntry } from '../core/entities/MarginHistoryEntry';
import { ValidationError } from '../core/errors/ValidationError';

export interface ClientMargin {
  clientId: string;
  baseMargin: Percentage;
  typeSpecificMargins: { campaignType: string; margin: Percentage }[];
  lastChangedAt: Date;
}

export interface MarginRepository {
  getClientMargin(clientId: string): Promise<ClientMargin>;
  updateBaseMargin(clientId: string, newMargin: Percentage, changedBy: string, note: string, effectiveDate: Date): Promise<void>;
  updateTypeSpecificMargin(clientId: string, campaignType: string, newMargin: Percentage, changedBy: string, note: string, effectiveDate: Date): Promise<void>;
  getMarginHistory(clientId: string): Promise<MarginHistoryEntry[]>;
}

export class MarginService {
  constructor(private readonly marginRepo: MarginRepository) {}

  async getClientMargin(clientId: string): Promise<ClientMargin> {
    return this.marginRepo.getClientMargin(clientId);
  }

  /**
   * Updates a client's base margin. FORWARD-LOOKING ONLY — the
   * effectiveDate must be today or in the future. Attempting to apply
   * a margin change to a past billing period is rejected.
   *
   * This is a mandatory-note-gated write action — the note must be
   * at least 10 characters.
   */
  async updateBaseMargin(
    clientId: string,
    newMargin: Percentage,
    changedBy: string,
    note: string,
    effectiveDate: Date = new Date(),
  ): Promise<void> {
    this.validateNote(note);
    this.validateEffectiveDate(effectiveDate);
    await this.marginRepo.updateBaseMargin(clientId, newMargin, changedBy, note, effectiveDate);
  }

  async updateTypeSpecificMargin(
    clientId: string,
    campaignType: string,
    newMargin: Percentage,
    changedBy: string,
    note: string,
    effectiveDate: Date = new Date(),
  ): Promise<void> {
    this.validateNote(note);
    this.validateEffectiveDate(effectiveDate);
    await this.marginRepo.updateTypeSpecificMargin(clientId, campaignType, newMargin, changedBy, note, effectiveDate);
  }

  async getMarginHistory(clientId: string): Promise<MarginHistoryEntry[]> {
    return this.marginRepo.getMarginHistory(clientId);
  }

  /**
   * Enforces forward-looking-only. A margin change with an effective
   * date in the past (a billing period that's already been billed)
   * is rejected — the save logic doesn't touch any already-billed period.
   */
  private validateEffectiveDate(effectiveDate: Date): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eff = new Date(effectiveDate);
    eff.setHours(0, 0, 0, 0);
    if (eff < today) {
      throw new ValidationError(
        'Margin changes are forward-looking only — cannot apply to a past billing period',
        'effectiveDate',
        'today-or-future',
      );
    }
  }

  private validateNote(note: string): void {
    if (!note || note.trim().length < 10) {
      throw new ValidationError(
        'A note of at least 10 characters is required for margin changes',
        'note',
        'min-10-chars',
      );
    }
  }
}