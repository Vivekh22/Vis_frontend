/**
 * AudienceService.ts — services/
 *
 * Purpose:
 *   CRUD for audience lists. Expanded to support rich audience targeting rules
 *   and source configurations.
 */
import { AudienceList } from '../core/entities/AudienceList';
import type { AudienceDataSourceConfig, AudienceRule, AudienceType, AudienceStatus } from '../core/entities/AudienceList';

export interface AudienceCreateData {
  name: string;
  description: string;
  audienceType: AudienceType;
  businessProduct: string;
  dataSource: AudienceDataSourceConfig;
  rules: AudienceRule[];
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
    
    // Simulate initial size processing
    const estimatedSize = Math.floor(Math.random() * 500000) + 10000;
    const reachMin = Math.floor(estimatedSize * 0.8);
    const reachMax = Math.floor(estimatedSize * 1.2);

    const list = new AudienceList(
      this.generateId('aud'),
      data.name,
      data.description,
      data.audienceType,
      data.businessProduct,
      data.dataSource,
      data.rules,
      estimatedSize,
      [reachMin, reachMax],
      'active',
      new Date(),
      new Date(),
      'client-1' // default
    );
    return await this.audienceRepo.save(list);
  }

  async updateAudience(id: string, data: AudienceCreateData): Promise<AudienceList> {
    const existing = await this.audienceRepo.findById(id);
    if (!existing) throw new Error(`Audience with id ${id} not found`);
    if (!data.dataSource.validated) {
      throw new Error('Cannot update audience: data source has not been validated');
    }

    const list = new AudienceList(
      existing.id,
      data.name,
      data.description,
      data.audienceType,
      data.businessProduct,
      data.dataSource,
      data.rules,
      existing.estimatedSize,
      existing.potentialReach,
      existing.status,
      existing.createdAt,
      new Date(),
      existing.clientId
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

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }
}