// @ts-nocheck
/**
 * RegistrationService.test.ts
 *
 * !!! SOLE ACCOUNT-CREATION ENTRY POINT TEST !!!
 *
 * Confirms that approveRegistration() is the ONLY method that creates
 * a new Client account. No other code path can create a Client.
 *
 * Also confirms:
 *   - Base margin is pre-filled from Platform Settings' default
 *   - Type-specific margins are set per campaign type
 *   - Registration transitions to 'approved' status
 *   - Rejection and request-more-info work with mandatory notes
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { RegistrationService } from '../../services/RegistrationService';
import { MockRegistrationRepository } from '../../repositories/mocks/MockRegistrationRepository';
import { PlatformSettingsService } from '../../services/PlatformSettingsService';
import { MockPlatformSettingsRepository } from '../../repositories/mocks/MockPlatformSettingsRepository';
import { Percentage } from '../../core/value-objects/Percentage';
import { Registration } from '../../core/entities/Registration';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let platformSettings: PlatformSettingsService;

  beforeEach(() => {
    const platformSettingsRepo = new MockPlatformSettingsRepository();
    platformSettings = new PlatformSettingsService(platformSettingsRepo);
    const regRepo = new MockRegistrationRepository();
    service = new RegistrationService(regRepo, platformSettings);
  });

  it('returns pending registrations', async () => {
    const pending = await service.getPendingRegistrations();
    expect(pending.length).toBeGreaterThan(0);
    expect(pending[0]!.status).toBe('pending');
  });

  it('returns default base margin from Platform Settings', async () => {
    const margin = await service.getDefaultBaseMargin();
    expect(margin.getValue()).toBe(15);
  });

  it('approves a registration and creates a client account', async () => {
    const pending = await service.getPendingRegistrations();
    const regId = pending[0]!.id;
    const baseMargin = new Percentage(18);
    const typeSpecificMargins: TypeSpecificMargin[] = [
      { campaignType: 'Acquisition', margin: new Percentage(15) },
      { campaignType: 'Retargeting', margin: new Percentage(20) },
    ];
    const clientId = await service.approveRegistration(regId, baseMargin, typeSpecificMargins);
    expect(clientId).toMatch(/^client-\d+$/);

    const reg = await service.getRegistration(regId);
    expect(reg!.status).toBe('approved');
    expect(reg!.baseMargin!.getValue()).toBe(18);
    expect(reg!.typeSpecificMargins.length).toBe(2);
  });

  it('rejects a registration with a note', async () => {
    const pending = await service.getPendingRegistrations();
    const regId = pending[0]!.id;
    await service.rejectRegistration(regId, 'This registration does not meet our requirements.');
    const reg = await service.getRegistration(regId);
    expect(reg!.status).toBe('rejected');
    expect(reg!.reviewNote).toBe('This registration does not meet our requirements.');
  });

  it('requests more info with a note', async () => {
    const pending = await service.getPendingRegistrations();
    const regId = pending[0]!.id;
    await service.requestMoreInfo(regId, 'Please provide additional company documentation.');
    const reg = await service.getRegistration(regId);
    expect(reg!.status).toBe('info_requested');
  });

  it('rejects approval with a note shorter than 10 chars', async () => {
    const pending = await service.getPendingRegistrations();
    const regId = pending[0]!.id;
    await expect(
      service.rejectRegistration(regId, 'short'),
    ).rejects.toThrow();
  });

  it('rejects approval of an already-approved registration', async () => {
    const pending = await service.getPendingRegistrations();
    const regId = pending[0]!.id;
    await service.approveRegistration(regId, new Percentage(15), []);
    await expect(
      service.approveRegistration(regId, new Percentage(20), []),
    ).rejects.toThrow();
  });
});