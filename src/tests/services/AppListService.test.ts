/**
 * AppListService.test.ts — tests for services/AppListService.
 *
 * Confirms NO approval gate exists — app lists are created and immediately
 * active. There is no pending_approval status path.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { AppListService } from '../../services/AppListService';
import type { AppListRepository } from '../../services/AppListService';
import { AppListEntry } from '../../core/entities/AppListEntry';

class MockAppListRepo implements AppListRepository {
  private entries: Map<string, AppListEntry> = new Map();

  async findById(id: string): Promise<AppListEntry | null> {
    return this.entries.get(id) ?? null;
  }

  async findAll(): Promise<AppListEntry[]> {
    return Array.from(this.entries.values());
  }

  async save(entry: AppListEntry): Promise<AppListEntry> {
    this.entries.set(entry.id, entry);
    return entry;
  }

  async delete(id: string): Promise<void> {
    this.entries.delete(id);
  }
}

describe('AppListService', () => {
  let repo: MockAppListRepo;
  let svc: AppListService;

  beforeEach(() => {
    repo = new MockAppListRepo();
    svc = new AppListService(repo);
  });

  it('createAppList creates entry with no approval status', async () => {
    const entry = await svc.createAppList({
      name: 'My Whitelist',
      appBundles: ['com.app1', 'com.app2'],
      placementIds: ['pl1'],
      urls: ['https://example.com'],
      listType: 'whitelist',
    });
    expect(entry.id).toBeTruthy();
    expect(entry.name).toBe('My Whitelist');
    expect(entry.appBundles).toHaveLength(2);
    expect(entry.appCount).toBe(2);
    // NO approval gate — entity has no status field, no pending_approval path
    expect(entry.whiteListedCount).toBe(2);
    expect(entry.blackListedCount).toBe(0);
  });

  it('listAppLists returns all entries', async () => {
    await svc.createAppList({ name: 'List 1', appBundles: ['a'], placementIds: [], urls: [], listType: 'whitelist' });
    await svc.createAppList({ name: 'List 2', appBundles: ['b'], placementIds: [], urls: [], listType: 'blacklist' });
    const lists = await svc.listAppLists();
    expect(lists).toHaveLength(2);
  });

  it('blacklist type counts correctly', async () => {
    const entry = await svc.createAppList({
      name: 'Blacklist',
      appBundles: ['x', 'y', 'z'],
      placementIds: [],
      urls: [],
      listType: 'blacklist',
    });
    expect(entry.whiteListedCount).toBe(0);
    expect(entry.blackListedCount).toBe(3);
  });

  it('deleteAppList removes entry', async () => {
    const entry = await svc.createAppList({ name: 'Temp', appBundles: ['a'], placementIds: [], urls: [], listType: 'whitelist' });
    await svc.deleteAppList(entry.id);
    const found = await svc.getAppList(entry.id);
    expect(found).toBeNull();
  });
});