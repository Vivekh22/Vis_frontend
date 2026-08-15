/**
 * AppListService.ts — services/
 *
 * Purpose:
 *   CRUD for app list entries. Per spec, this module has NO approval gate
 *   — there is no pending_approval status path at all. App lists are
 *   targeting configuration, not creative content, so they go live
 *   immediately on creation.
 */
import { AppListEntry } from '../core/entities/AppListEntry';
import type { AppListType } from '../core/entities/AppListEntry';

export interface AppListCreateData {
  name: string;
  appBundles: string[];
  placementIds: string[];
  urls: string[];
  listType: AppListType;
}

export interface AppListRepository {
  findById(id: string): Promise<AppListEntry | null>;
  findAll(): Promise<AppListEntry[]>;
  save(entry: AppListEntry): Promise<AppListEntry>;
  delete(id: string): Promise<void>;
}

export class AppListService {
  constructor(private readonly appListRepo: AppListRepository) {}

  async createAppList(data: AppListCreateData): Promise<AppListEntry> {
    const entry = new AppListEntry(
      this.generateId('al'),
      data.name,
      data.appBundles,
      data.placementIds,
      data.urls,
      data.listType,
    );
    return await this.appListRepo.save(entry);
  }

  async listAppLists(): Promise<AppListEntry[]> {
    return await this.appListRepo.findAll();
  }

  async getAppList(id: string): Promise<AppListEntry | null> {
    return await this.appListRepo.findById(id);
  }

  async deleteAppList(id: string): Promise<void> {
    await this.appListRepo.delete(id);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}