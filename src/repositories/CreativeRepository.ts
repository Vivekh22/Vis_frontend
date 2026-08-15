/**
 * CreativeRepository.ts — repositories/
 *
 * Real implementation of the CreativeRepository interface from CreativeService.
 * Calls the creative API endpoints and maps DTOs to Creative domain entities.
 *
 * Assumed endpoint shape (de facto API contract):
 *   GET    /api/creatives/:id              → CreativeDto
 *   GET    /api/creatives?campaignId=&status= → CreativeDto[]
 *   PUT    /api/creatives/:id              (upsert) → CreativeDto
 *   DELETE /api/creatives/:id
 *
 *   CreativeDto: {
 *     id: string, name: string, campaignId: string,
 *     format: string, assetUrl: string,
 *     status: CreativeStatus, createdAt: string (ISO)
 *   }
 */
import { Creative } from '../core/entities/Creative';
import type { CreativeStatus } from '../core/enums/CreativeStatus';
import type { CreativeFilter, CreativeRepository as ICreativeRepository } from '../services/CreativeService';
import { ApiClient } from './ApiClient';
import { ApiError } from '../core/errors/ApiError';

interface CreativeDto {
  id: string;
  name: string;
  campaignId: string;
  format: string;
  assetUrl: string;
  status: CreativeStatus;
  createdAt: string;
}

export function mapDtoToCreative(dto: CreativeDto): Creative {
  return new Creative(
    dto.id,
    dto.name,
    dto.campaignId,
    dto.format,
    dto.assetUrl,
    dto.status,
    new Date(dto.createdAt),
  );
}

export function mapCreativeToDto(creative: Creative): CreativeDto {
  return {
    id: creative.id,
    name: creative.name,
    campaignId: creative.campaignId,
    format: creative.format,
    assetUrl: creative.assetUrl,
    status: creative.status,
    createdAt: creative.createdAt.toISOString(),
  };
}

export class CreativeRepository implements ICreativeRepository {
  constructor(private readonly api: ApiClient) {}

  async findById(id: string): Promise<Creative | null> {
    try {
      const dto = await this.api.get<CreativeDto>(`/api/creatives/${encodeURIComponent(id)}`);
      return mapDtoToCreative(dto);
    } catch (err) {
      if (err instanceof ApiError && err.isNotFound) return null;
      throw err;
    }
  }

  async findAll(filter?: CreativeFilter): Promise<Creative[]> {
    const params = new URLSearchParams();
    if (filter?.campaignId) params.set('campaignId', filter.campaignId);
    if (filter?.status) params.set('status', filter.status);
    const query = params.toString();
    const path = query ? `/api/creatives?${query}` : '/api/creatives';
    const dtos = await this.api.get<CreativeDto[]>(path);
    return dtos.map(mapDtoToCreative);
  }

  async save(creative: Creative): Promise<Creative> {
    const dto = await this.api.put<CreativeDto>(
      `/api/creatives/${encodeURIComponent(creative.id)}`,
      mapCreativeToDto(creative),
    );
    return mapDtoToCreative(dto);
  }

  async delete(id: string): Promise<void> {
    await this.api.delete<void>(`/api/creatives/${encodeURIComponent(id)}`);
  }
}