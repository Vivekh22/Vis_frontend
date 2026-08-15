/**
 * MmpSingleSourceOfTruth.test.ts
 *
 * Proves that Part 10's client-facing Integrations page reads its MMP
 * provider list from Part 13's MasterIntegrationService, not a hardcoded
 * list. The MMP_PROVIDERS constant was removed from IntegrationsPageElement
 * and replaced with an async fetch from masterIntegrationService.getMmpList().
 */
import { describe, it, expect } from 'vitest';
import { MasterIntegrationService } from '../../services/MasterIntegrationService';
import { MockMasterIntegrationRepository, MASTER_MMP_LIST } from '../../repositories/mocks/MockMasterIntegrationRepository';

describe('MMP List Single Source of Truth', () => {
  it('MasterIntegrationService returns the canonical MMP list', async () => {
    const repo = new MockMasterIntegrationRepository();
    const service = new MasterIntegrationService(repo);
    const list = await service.getMmpList();

    expect(list.length).toBe(MASTER_MMP_LIST.length);
    expect(list.map((m) => m.name)).toEqual(MASTER_MMP_LIST.map((m) => m.name));
  });

  it('the MMP list includes AppsFlyer, Adjust, Kochava, Branch, Singular', async () => {
    const repo = new MockMasterIntegrationRepository();
    const service = new MasterIntegrationService(repo);
    const list = await service.getMmpList();
    const names = list.map((m) => m.name);

    expect(names).toContain('AppsFlyer');
    expect(names).toContain('Adjust');
    expect(names).toContain('Kochava');
    expect(names).toContain('Branch');
    expect(names).toContain('Singular');
  });

  it('adding an MMP to the master list makes it available to clients', async () => {
    const repo = new MockMasterIntegrationRepository();
    const service = new MasterIntegrationService(repo);

    await service.addMmp('Tenjin', 'tenjin');
    const list = await service.getMmpList();
    expect(list.some((m) => m.name === 'Tenjin')).toBe(true);
  });

  it('IntegrationsPageElement no longer has a hardcoded MMP_PROVIDERS constant', () => {
    // The hardcoded MMP_PROVIDERS constant was removed and replaced with
    // an async fetch from masterIntegrationService.getMmpList().
    // This is verified by code inspection: the import of MasterMmpEntry
    // and masterIntegrationService is present, and MMP_PROVIDERS is absent.
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(
      __dirname,
      '../../pages/client/integrations-api-keys/IntegrationsPageElement.ts',
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).not.toContain('MMP_PROVIDERS');
    expect(content).toContain('masterIntegrationService');
    expect(content).toContain('getMmpList');
  });
});