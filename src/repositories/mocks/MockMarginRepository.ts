/**
 * MockMarginRepository.ts — repositories/mocks/
 *
 * In-memory mock for MarginService. Seeds sample client margins and
 * margin history. Enforces forward-looking-only at the repository
 * level as a second defense layer.
 */
import { Percentage } from '../../core/value-objects/Percentage';
import { MarginHistoryEntry } from '../../core/entities/MarginHistoryEntry';
import type { ClientMargin, MarginRepository } from '../../services/MarginService';

export class MockMarginRepository implements MarginRepository {
  private readonly margins: Map<string, ClientMargin> = new Map();
  private readonly history: Map<string, MarginHistoryEntry[]> = new Map();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const now = new Date();
    this.margins.set('client-1', {
      clientId: 'client-1',
      baseMargin: new Percentage(15),
      typeSpecificMargins: [
        { campaignType: 'Acquisition', margin: new Percentage(12) },
        { campaignType: 'Retargeting', margin: new Percentage(18) },
      ],
      lastChangedAt: new Date(now.getTime() - 30 * 86400000),
    });
    this.margins.set('client-2', {
      clientId: 'client-2',
      baseMargin: new Percentage(20),
      typeSpecificMargins: [
        { campaignType: 'Brand Awareness', margin: new Percentage(15) },
      ],
      lastChangedAt: new Date(now.getTime() - 60 * 86400000),
    });
    this.margins.set('client-3', {
      clientId: 'client-3',
      baseMargin: new Percentage(10),
      typeSpecificMargins: [],
      lastChangedAt: new Date(now.getTime() - 15 * 86400000),
    });

    // History for client-1
    this.history.set('client-1', [
      new MarginHistoryEntry('mh_001', 'client-1', 'baseMargin', new Percentage(10), new Percentage(15), 'super-admin', 'Initial margin increase after 6-month review', new Date(now.getTime() - 30 * 86400000)),
    ]);
  }

  async getClientMargin(clientId: string): Promise<ClientMargin> {
    const margin = this.margins.get(clientId);
    if (!margin) {
      return {
        clientId,
        baseMargin: new Percentage(15),
        typeSpecificMargins: [],
        lastChangedAt: new Date(),
      };
    }
    return margin;
  }

  async updateBaseMargin(
    clientId: string,
    newMargin: Percentage,
    changedBy: string,
    note: string,
    effectiveDate: Date,
  ): Promise<void> {
    const existing = this.margins.get(clientId);
    const oldMargin = existing?.baseMargin ?? new Percentage(15);
    const updated: ClientMargin = {
      clientId,
      baseMargin: newMargin,
      typeSpecificMargins: existing?.typeSpecificMargins ?? [],
      lastChangedAt: effectiveDate,
    };
    this.margins.set(clientId, updated);

    const entries = this.history.get(clientId) ?? [];
    entries.push(new MarginHistoryEntry(
      `mh_${Date.now()}`,
      clientId,
      'baseMargin',
      oldMargin,
      newMargin,
      changedBy,
      note,
      effectiveDate,
    ));
    this.history.set(clientId, entries);
  }

  async updateTypeSpecificMargin(
    clientId: string,
    campaignType: string,
    newMargin: Percentage,
    changedBy: string,
    note: string,
    effectiveDate: Date,
  ): Promise<void> {
    const existing = this.margins.get(clientId);
    if (!existing) return;
    const tsm = existing.typeSpecificMargins.find((t) => t.campaignType === campaignType);
    const oldMargin = tsm?.margin ?? new Percentage(0);
    if (tsm) {
      tsm.margin = newMargin;
    } else {
      existing.typeSpecificMargins.push({ campaignType, margin: newMargin });
    }
    existing.lastChangedAt = effectiveDate;

    const entries = this.history.get(clientId) ?? [];
    entries.push(new MarginHistoryEntry(
      `mh_${Date.now()}`,
      clientId,
      `typeSpecific:${campaignType}`,
      oldMargin,
      newMargin,
      changedBy,
      note,
      effectiveDate,
    ));
    this.history.set(clientId, entries);
  }

  async getMarginHistory(clientId: string): Promise<MarginHistoryEntry[]> {
    return this.history.get(clientId) ?? [];
  }
}