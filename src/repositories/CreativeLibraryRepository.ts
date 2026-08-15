/**
 * CreativeLibraryRepository.ts — repositories/
 *
 * Real implementation of CreativeLibraryRepository.
 * Calls the creative library API endpoints and maps DTOs.
 */
import type { LibraryAsset, CreativeLibraryRepository } from '../services/CreativeLibraryService';
import { ApiClient } from './ApiClient';

interface LibraryAssetDto {
  id: string;
  name: string;
  type: 'image' | 'logo' | 'video';
  url: string;
  uploadedAt: string;
}

function mapDtoToAsset(dto: LibraryAssetDto): LibraryAsset {
  return { ...dto, uploadedAt: new Date(dto.uploadedAt) };
}

export class CreativeLibraryRepositoryImpl implements CreativeLibraryRepository {
  constructor(private readonly api: ApiClient) {}

  async findAll(): Promise<LibraryAsset[]> {
    const dtos = await this.api.get<LibraryAssetDto[]>('/api/creative-library');
    return dtos.map(mapDtoToAsset);
  }

  async findById(id: string): Promise<LibraryAsset | null> {
    try {
      const dto = await this.api.get<LibraryAssetDto>(`/api/creative-library/${encodeURIComponent(id)}`);
      return mapDtoToAsset(dto);
    } catch {
      return null;
    }
  }

  async save(asset: LibraryAsset): Promise<LibraryAsset> {
    const dto: LibraryAssetDto = { ...asset, uploadedAt: asset.uploadedAt.toISOString() };
    const result = await this.api.put<LibraryAssetDto>(`/api/creative-library/${encodeURIComponent(asset.id)}`, dto);
    return mapDtoToAsset(result);
  }

  async delete(id: string): Promise<void> {
    await this.api.delete<void>(`/api/creative-library/${encodeURIComponent(id)}`);
  }
}