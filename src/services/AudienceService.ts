/**
 * AudienceService.ts — services/
 *
 * Purpose:
 *   CRUD for audience lists. Audience lists are created with a data source
 *   (CSV file, API, or CSV link) that must be validated before the list
 *   can be saved. The service delegates validation to the caller (page
 *   component) but enforces that dataSource.validated === true before
 *   persisting.
 */
import { AudienceList } from '../core/entities/AudienceList';
import type { AudienceDataSourceConfig } from '../core/entities/AudienceList';
import type { AudienceListType } from '../core/entities/AudienceList';

export interface AudienceCreateData {
  name: string;
  listType: AudienceListType;
  comments: string | null;
  dataSource: AudienceDataSourceConfig;
}

export interface AudienceRepository {
  findById(id: string): Promise<AudienceList | null>;
  findAll(): Promise<AudienceList[]>;
  save(list: AudienceList): Promise<AudienceList>;
  delete(id: string): Promise<void>;
}

export class AudienceService {
  constructor(private readonly audienceRepo: AudienceRepository) {}

  async createAudience(data: AudienceCreateData): Promise<AudienceList> {
    if (!data.dataSource.validated) {
      throw new Error('Cannot save audience: data source has not been validated');
    }
    const size = this.computeSize(data.dataSource);
    const list = new AudienceList(
      this.generateId('aud'),
      data.name,
      size,
      new Date(),
      data.listType,
      data.comments,
      data.dataSource,
    );
    return await this.audienceRepo.save(list);
  }

  async listAudiences(): Promise<AudienceList[]> {
    return await this.audienceRepo.findAll();
  }

  async getAudience(id: string): Promise<AudienceList | null> {
    return await this.audienceRepo.findById(id);
  }

  async deleteAudience(id: string): Promise<void> {
    await this.audienceRepo.delete(id);
  }

  /**
   * Computes the user count from the data source. For CSV, this is the
   * row count. For API, we trust the validated flag (size set during
   * validation). For CSV link, same as CSV.
   */
  private computeSize(dataSource: AudienceDataSourceConfig): number {
    if (dataSource.type === 'csv_file' || dataSource.type === 'csv_link') {
      if (dataSource.csvData) {
        const lines = dataSource.csvData.trim().split('\n');
        // Subtract 1 for header row; minimum 0
        return Math.max(0, lines.length - 1);
      }
      return 0;
    }
    // For API, size is determined during connection test
    return 0;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}