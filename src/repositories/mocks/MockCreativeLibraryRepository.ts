/**
 * MockCreativeLibraryRepository.ts — repositories/mocks/
 *
 * In-memory mock for CreativeLibraryRepository.
 */
import type { LibraryAsset, CreativeLibraryRepository } from '../../services/CreativeLibraryService';

export class MockCreativeLibraryRepository implements CreativeLibraryRepository {
  private readonly assets: Map<string, LibraryAsset> = new Map();

  seed(assets: LibraryAsset[]): void {
    for (const a of assets) this.assets.set(a.id, a);
  }

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