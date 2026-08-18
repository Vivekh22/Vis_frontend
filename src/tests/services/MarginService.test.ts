// @ts-nocheck
/**
 * MarginService.test.ts
 *
 * Confirms:
 *   - Margin changes are FORWARD-LOOKING ONLY — never retroactive
 *   - Attempting to apply a margin change to a past billing period is rejected
 *   - Mandatory note is required (min 10 chars)
 *   - History records old value, new value, changed-by, note
 *   - Uses Percentage value object throughout, never raw numbers
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { MarginService } from '../../services/MarginService';
import { MockMarginRepository } from '../../repositories/mocks/MockMarginRepository';
import { Percentage } from '../../core/value-objects/Percentage';

describe('MarginService', () => {
  let service: MarginService;

  beforeEach(() => {
    const repo = new MockMarginRepository();
    service = new MarginService(repo);
  });

  it('returns client margin with Percentage value objects', async () => {
    const margin = await service.getClientMargin('client-1');
    expect(margin.baseMargin).toBeInstanceOf(Percentage);
    expect(margin.baseMargin.getValue()).toBe(15);
    expect(margin.typeSpecificMargins.length).toBeGreaterThan(0);
    expect(margin.typeSpecificMargins[0]!.margin).toBeInstanceOf(Percentage);
  });

  it('updates base margin with valid note and forward-looking date', async () => {
    await service.updateBaseMargin(
      'client-1',
      new Percentage(20),
      'super-admin',
      'Quarterly margin review adjustment',
      new Date(),
    );
    const margin = await service.getClientMargin('client-1');
    expect(margin.baseMargin.getValue()).toBe(20);
  });

  it('REJECTS margin change with a past effective date (forward-looking-only)', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    await expect(
      service.updateBaseMargin(
        'client-1',
        new Percentage(20),
        'super-admin',
        'Attempting retroactive change to past billing period',
        pastDate,
      ),
    ).rejects.toThrow('forward-looking only');
  });

  it('REJECTS margin change with a note shorter than 10 chars', async () => {
    await expect(
      service.updateBaseMargin(
        'client-1',
        new Percentage(20),
        'super-admin',
        'short',
        new Date(),
      ),
    ).rejects.toThrow('10 characters');
  });

  it('REJECTS margin change with an empty note', async () => {
    await expect(
      service.updateBaseMargin(
        'client-1',
        new Percentage(20),
        'super-admin',
        '',
        new Date(),
      ),
    ).rejects.toThrow('10 characters');
  });

  it('records margin history with old and new values', async () => {
    await service.updateBaseMargin(
      'client-1',
      new Percentage(25),
      'super-admin',
      'Annual contract renegotiation',
      new Date(),
    );
    const history = await service.getMarginHistory('client-1');
    const latest = history[history.length - 1]!;
    expect(latest.oldValue.getValue()).toBe(15);
    expect(latest.newValue.getValue()).toBe(25);
    expect(latest.changedBy).toBe('super-admin');
    expect(latest.note).toBe('Annual contract renegotiation');
  });

  it('updates type-specific margin', async () => {
    await service.updateTypeSpecificMargin(
      'client-1',
      'Acquisition',
      new Percentage(10),
      'super-admin',
      'Adjusting acquisition campaign margin',
      new Date(),
    );
    const margin = await service.getClientMargin('client-1');
    const tsm = margin.typeSpecificMargins.find((t) => t.campaignType === 'Acquisition');
    expect(tsm!.margin.getValue()).toBe(10);
  });
});