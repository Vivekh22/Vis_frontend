// @ts-nocheck
/**
 * CreativeLibraryService.test.ts — tests for services/CreativeLibraryService.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { CreativeLibraryService } from '../../services/CreativeLibraryService';
import { CreativeLibraryService } from '../../services/CreativeLibraryService';

class MockLibraryRepo implements CreativeLibraryRepository {
  private assets: Map<string, LibraryAsset> = new Map();

  async findAll(): Promise<LibraryAsset[]> {
    return Array.from(this.assets.values());
  }

  async findById(id: string): Promise<LibraryAsset | null> {
    return this.assets.get(id) ?? null;
  }

  async save(asset: LibraryAsset): Promise<LibraryAsset> {
    this.assets.set(asset.id, asset);
    return asset;
  }

  async delete(id: string): Promise<void> {
    this.assets.delete(id);
  }
}

describe('CreativeLibraryService', () => {
  let repo: MockLibraryRepo;
  let svc: CreativeLibraryService;

  beforeEach(() => {
    repo = new MockLibraryRepo();
    svc = new CreativeLibraryService(repo);
  });

  it('registerAsset saves and returns asset', async () => {
    const asset = await svc.registerAsset('logo.png', 'image', 'mock://logo.png');
    expect(asset.id).toBeTruthy();
    expect(asset.name).toBe('logo.png');
    expect(asset.type).toBe('image');
  });

  it('listAssets returns all registered assets', async () => {
    await svc.registerAsset('img1.png', 'image', 'mock://img1.png');
    await svc.registerAsset('video1.mp4', 'video', 'mock://video1.mp4');
    const assets = await svc.listAssets();
    expect(assets).toHaveLength(2);
  });

  it('getAsset returns asset by id', async () => {
    const saved = await svc.registerAsset('logo.png', 'logo', 'mock://logo.png');
    const found = await svc.getAsset(saved.id);
    expect(found?.name).toBe('logo.png');
  });

  it('getAsset returns null for unknown id', async () => {
    const found = await svc.getAsset('nonexistent');
    expect(found).toBeNull();
  });

  it('deleteAsset removes asset', async () => {
    const saved = await svc.registerAsset('logo.png', 'image', 'mock://logo.png');
    await svc.deleteAsset(saved.id);
    const found = await svc.getAsset(saved.id);
    expect(found).toBeNull();
  });
});