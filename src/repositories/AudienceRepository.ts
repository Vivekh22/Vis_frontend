/**
 * AudienceRepository.ts — repositories/
 *
 * Real implementation of AudienceRepository.
 * Calls the audience API endpoints and maps DTOs to AudienceList entities.
 */
import { AudienceList } from '../core/entities/AudienceList';
import type { AudienceListType, AudienceDataSourceConfig } from '../core/entities/AudienceList';
import type { AudienceRepository as IAudienceRepository } from '../services/AudienceService';
import { ApiClient } from './ApiClient';

interface AudienceDataSourceDto {
  type: string;
  csvData?: string;
  apiUrl?: string;
  apiKey?: string;
  csvLinkUrl?: string;
  validated: boolean;
}

interface AudienceListDto {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  listType: AudienceListType;
  comments: string | null;
  dataSource: AudienceDataSourceDto | null;
}

function mapDtoToDataSource(dto: AudienceDataSourceDto | null): AudienceDataSourceConfig | null {
  if (!dto) return null;
  return {
    type: dto.type as AudienceDataSourceConfig['type'],
    csvData: dto.csvData,
    apiUrl: dto.apiUrl,
    apiKey: dto.apiKey,
    csvLinkUrl: dto.csvLinkUrl,
    validated: dto.validated,
  };
}

function mapDtoToList(dto: AudienceListDto): AudienceList {
  return new AudienceList(
    dto.id,
    dto.name,
    dto.size,
    new Date(dto.createdAt),
    dto.listType,
    dto.comments,
    mapDtoToDataSource(dto.dataSource),
  );
}

export class AudienceRepository implements IAudienceRepository {
  constructor(private readonly api: ApiClient) {}

  async findById(id: string): Promise<AudienceList | null> {
    try {
      const dto = await this.api.get<AudienceListDto>(`/api/audiences/${encodeURIComponent(id)}`);
      return mapDtoToList(dto);
    } catch {
      return null;
    }
  }

  async findAll(): Promise<AudienceList[]> {
    const dtos = await this.api.get<AudienceListDto[]>('/api/audiences');
    return dtos.map(mapDtoToList);
  }

  async save(list: AudienceList): Promise<AudienceList> {
    const dto: AudienceListDto = {
      id: list.id,
      name: list.name,
      size: list.size,
      createdAt: list.createdAt.toISOString(),
      listType: list.listType,
      comments: list.comments,
      dataSource: list.dataSource
        ? {
            type: list.dataSource.type,
            csvData: list.dataSource.csvData,
            apiUrl: list.dataSource.apiUrl,
            apiKey: list.dataSource.apiKey,
            csvLinkUrl: list.dataSource.csvLinkUrl,
            validated: list.dataSource.validated,
          }
        : null,
    };
    const result = await this.api.put<AudienceListDto>(`/api/audiences/${encodeURIComponent(list.id)}`, dto);
    return mapDtoToList(result);
  }

  async delete(id: string): Promise<void> {
    await this.api.delete<void>(`/api/audiences/${encodeURIComponent(id)}`);
  }
}