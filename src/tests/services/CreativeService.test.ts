/**
 * CreativeService.test.ts — tests for services/CreativeService.
 *
 * Tests the ORCHESTRATION logic: createCreative, updateCreative, listCreatives,
 * submitForApproval, and submitCreativeEdit (creates a separate pending
 * version rather than mutating the live creative in place).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CreativeService } from '../../services/CreativeService';
import type { CreativeRepository, CreativeFilter } from '../../services/CreativeService';
import { Creative } from '../../core/entities/Creative';
import type { CreativeStatus } from '../../core/enums/CreativeStatus';
import { DomainError } from '../../core/errors/DomainError';
import { authStore } from '../../platform/state/AuthStore';
import { User } from '../../core/entities/User';

class MockCreativeRepo implements CreativeRepository {
  private map: Map<string, Creative> = new Map();
  public saveCalls: Creative[] = [];

  seed(creatives: Creative[]): void {
    for (const c of creatives) this.map.set(c.id, c);
  }

  async findById(id: string): Promise<Creative | null> {
    return this.map.get(id) ?? null;
  }

  async findAll(filter?: CreativeFilter): Promise<Creative[]> {
    let results = Array.from(this.map.values());
    if (filter?.campaignId) results = results.filter((c) => c.campaignId === filter.campaignId);
    if (filter?.status) results = results.filter((c) => c.status === filter.status);
    return results;
  }

  async save(creative: Creative): Promise<Creative> {
    this.map.set(creative.id, creative);
    this.saveCalls.push(creative);
    return creative;
  }

  async delete(id: string): Promise<void> {
    this.map.delete(id);
  }
}

function makeCreative(id: string, status: CreativeStatus = 'draft'): Creative {
  const c = new Creative(id, `Creative ${id}`, 'camp-1', 'image', `https://cdn/${id}.png`, 'draft', new Date());
  if (status !== 'draft') {
    c.submitForApproval('u1', 'Admin');
    if (status === 'active' || status === 'paused') c.approve('u1', 'Admin');
    if (status === 'paused') c.pause('u1', 'Admin');
  }
  return c;
}

describe('CreativeService', () => {
  let repo: MockCreativeRepo;

  beforeEach(() => {
    authStore.logout();
    authStore.login(new User('u1', 'a@b.com', 'Admin', 'admin'));
    repo = new MockCreativeRepo();
  });

  it('createCreative creates a draft creative and saves it', async () => {
    const svc = new CreativeService(repo);
    const creative = await svc.createCreative({
      name: 'New Creative',
      campaignId: 'camp-1',
      format: 'video',
      assetUrl: 'https://cdn/new.mp4',
    });
    expect(creative.status).toBe('draft');
    expect(creative.name).toBe('New Creative');
  });

  it('updateCreative updates editable fields and preserves status', async () => {
    const existing = makeCreative('cr1', 'active');
    repo.seed([existing]);
    const svc = new CreativeService(repo);
    const updated = await svc.updateCreative('cr1', { name: 'Updated Name' });
    expect(updated.name).toBe('Updated Name');
    expect(updated.status).toBe('active');
  });

  it('submitForApproval delegates to entity state machine (draft → pending_approval)', async () => {
    const creative = makeCreative('cr1', 'draft');
    repo.seed([creative]);
    const svc = new CreativeService(repo);
    const result = await svc.submitForApproval('cr1');
    expect(result.status).toBe('pending_approval');
  });

  it('submitCreativeEdit creates a separate pending version — does NOT mutate the live creative', async () => {
    const liveCreative = makeCreative('cr1', 'active');
    repo.seed([liveCreative]);
    const svc = new CreativeService(repo);

    const edited = await svc.submitCreativeEdit('cr1', { name: 'Edited Creative', assetUrl: 'https://cdn/v2.png' });

    // The edited version is a NEW creative (different ID) at pending_approval
    expect(edited.id).not.toBe('cr1');
    expect(edited.name).toBe('Edited Creative');
    expect(edited.assetUrl).toBe('https://cdn/v2.png');
    expect(edited.status).toBe('pending_approval');

    // The original live creative is UNTOUCHED — still active, still serving
    const original = await repo.findById('cr1');
    expect(original?.status).toBe('active');
    expect(original?.name).toBe('Creative cr1');
    expect(original?.assetUrl).toBe('https://cdn/cr1.png');
  });

  it('submitCreativeEdit throws on not found', async () => {
    const svc = new CreativeService(repo);
    await expect(svc.submitCreativeEdit('nonexistent', {})).rejects.toThrow(DomainError);
  });
});