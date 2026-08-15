/**
 * ConnectedPublishersPlaceholders.test.ts
 *
 * Proves that Connected Publishers and Connected DSPs render as clear
 * "not yet available" placeholders using EmptyStateElement — not broken
 * or empty tables.
 */
import { describe, it, expect } from 'vitest';

describe('Connected Publishers/DSPs Placeholders', () => {
  it('ConnectedPublishersPageElement renders EmptyStateElement with clear messaging', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(
      __dirname,
      '../../pages/super-admin/platform-connections/connected-publishers/ConnectedPublishersPageElement.ts',
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('empty-state');
    expect(content).toContain('Available once supply-side operations are enabled');
    // Must NOT contain a table or workflow UI
    expect(content).not.toContain('<table');
    expect(content).not.toContain('<thead');
  });

  it('ConnectedDspsPageElement renders EmptyStateElement with clear messaging', () => {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.resolve(
      __dirname,
      '../../pages/super-admin/platform-connections/connected-dsps/ConnectedDspsPageElement.ts',
    );
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('empty-state');
    expect(content).toContain('Available once supply-side operations are enabled');
    // Must NOT contain a table or workflow UI
    expect(content).not.toContain('<table');
    expect(content).not.toContain('<thead');
  });

  it('PlatformConnectionService returns empty arrays for publishers and DSPs', async () => {
    const { MockPlatformConnectionRepository } = await import(
      '../../repositories/mocks/MockPlatformConnectionRepository'
    );
    const { PlatformConnectionService } = await import(
      '../../services/PlatformConnectionService'
    );
    const repo = new MockPlatformConnectionRepository();
    const service = new PlatformConnectionService(repo);

    const publishers = await service.getConnectedPublishers();
    const dsps = await service.getConnectedDsps();

    expect(publishers).toEqual([]);
    expect(dsps).toEqual([]);
  });
});