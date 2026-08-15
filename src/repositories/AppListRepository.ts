/**
 * AppListRepository.ts — repositories/
 *
 * Real implementation of AppListRepository.
 * Calls the app list API endpoints and maps DTOs to AppListEntry entities.
 */
import { AppListEntry } from '../core/entities/AppListEntry';
import type { AppListType } from '../core/entities/AppListEntry';
import type { AppListRepository as IAppListRepository } from '../services/AppListService';
import { ApiClient } from './ApiClient';

interface AppListDto {
  id: string;
  name: string;
  appBundles: string[];
  placementIds: string[];
  urls: string[];
  listType: AppListType;
  createdAt: string;
}

function mapDtoToEntry(dto: AppListDto): AppListEntry {
  return new AppListEntry(
    dto.id,
    dto.name,
    dto.appBundles,
    dto.placementIds,
    dto.urls,
    dto.listType,
    new Date(dto.createdAt),
  );
}

export class AppListRepository implements IAppListRepository {
  constructor(private readonly api: ApiClient) {}

  async findById(id: string): Promise<AppListEntry | null> {
    try {
      const dto = await this.api.get<AppListDto>(`/api/app-lists/${encodeURIComponent(id)}`);
      return mapDtoToEntry(dto);
    } catch {
      return null;
    }
  }

  async findAll(): Promise<AppListEntry[]> {
    const dtos = await this.api.get<AppListDto[]>('/api/app-lists');
    return dtos.map(mapDtoToEntry);
  }

  async save(entry: AppListEntry): Promise<AppListEntry> {
    const dto: AppListDto = {
      id: entry.id,
      name: entry.name,
      appBundles: entry.appBundles,
      placementIds: entry.placementIds,
      urls: entry.urls,
      listType: entry.listType,
      createdAt: entry.createdAt.toISOString(),
    };
    const result = await this.api.put<AppListDto>(`/api/app-lists/${encodeURIComponent(entry.id)}`, dto);
    return mapDtoToEntry(result);
  }

  async delete(id: string): Promise<void> {
    await this.api.delete<void>(`/api/app-lists/${encodeURIComponent(id)}`);
  }
}