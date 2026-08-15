/**
 * CreativeLibraryService.ts — services/
 *
 * Purpose:
 *   Manages a reusable creative asset library — images, logos, videos
 *   stored once and reusable across multiple creatives without re-upload.
 *
 *   When a real backend exists, assets are uploaded via UploadService
 *   and registered here with a library ID. For mock mode, assets are
 *   stored in memory.
 */
export interface LibraryAsset {
  id: string;
  name: string;
  type: 'image' | 'logo' | 'video';
  url: string;
  uploadedAt: Date;
}

export interface CreativeLibraryRepository {
  findAll(): Promise<LibraryAsset[]>;
  findById(id: string): Promise<LibraryAsset | null>;
  save(asset: LibraryAsset): Promise<LibraryAsset>;
  delete(id: string): Promise<void>;
}

export class CreativeLibraryService {
  constructor(private readonly libraryRepo: CreativeLibraryRepository) {}

  async listAssets(): Promise<LibraryAsset[]> {
    return await this.libraryRepo.findAll();
  }

  async getAsset(id: string): Promise<LibraryAsset | null> {
    return await this.libraryRepo.findById(id);
  }

  async registerAsset(name: string, type: 'image' | 'logo' | 'video', url: string): Promise<LibraryAsset> {
    const asset: LibraryAsset = {
      id: this.generateId('asset'),
      name,
      type,
      url,
      uploadedAt: new Date(),
    };
    return await this.libraryRepo.save(asset);
  }

  async deleteAsset(id: string): Promise<void> {
    await this.libraryRepo.delete(id);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}