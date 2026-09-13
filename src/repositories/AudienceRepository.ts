/**
 * AudienceRepository.ts — repositories/
 *
 * Real implementation of AudienceRepository.
 * Calls the audience API endpoints and maps DTOs to AudienceList entities.
 */
import { AudienceList } from '../core/entities/AudienceList';
import type { AudienceType, AudienceStatus, AudienceDataSourceConfig, AudienceRule } from '../core/entities/AudienceList';
import type { AudienceRepository as IAudienceRepository } from '../services/AudienceService';
import { ApiClient } from './ApiClient';

interface AudienceDataSourceDto {
  type: string;
  csvData?: string;
  apiUrl?: string;
  apiKey?: string;
  csvLinkUrl?: string;
  validated: boolean;
  activityWindowDays?: number;
  selectedEvents?: string[];
  selectedProducts?: string[];
}

interface AudienceListDto {
  id: string;
  name: string;
  description: string;
  audienceType: AudienceType;
  businessProduct: string;
  dataSource: AudienceDataSourceDto;
  rules: AudienceRule[];
  estimatedSize: number;
  potentialReach: [number, number];
  status: AudienceStatus;
  createdAt: string;
  updatedAt: string;
  clientId: string;
}

function mapDtoToDataSource(dto: AudienceDataSourceDto): AudienceDataSourceConfig {
  return {
    type: dto.type as AudienceDataSourceConfig['type'],
    csvData: dto.csvData,
    apiUrl: dto.apiUrl,
    apiKey: dto.apiKey,
    csvLinkUrl: dto.csvLinkUrl,
    validated: dto.validated,
    activityWindowDays: dto.activityWindowDays,
    selectedEvents: dto.selectedEvents,
    selectedProducts: dto.selectedProducts,
  };
}

function mapDtoToList(dto: AudienceListDto): AudienceList {
  return new AudienceList(
    dto.id,
    dto.name,
    dto.description,
    dto.audienceType,
    dto.businessProduct,
    mapDtoToDataSource(dto.dataSource),
    dto.rules,
    dto.estimatedSize,
    dto.potentialReach,
    dto.status,
    new Date(dto.createdAt),
    new Date(dto.updatedAt),
    dto.clientId
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
      description: list.description,
      audienceType: list.audienceType,
      businessProduct: list.businessProduct,
      dataSource: {
        type: list.dataSource.type,
        csvData: list.dataSource.csvData,
        apiUrl: list.dataSource.apiUrl,
        apiKey: list.dataSource.apiKey,
        csvLinkUrl: list.dataSource.csvLinkUrl,
        validated: list.dataSource.validated,
        activityWindowDays: list.dataSource.activityWindowDays,
        selectedEvents: list.dataSource.selectedEvents,
        selectedProducts: list.dataSource.selectedProducts,
      },
      rules: list.rules,
      estimatedSize: list.estimatedSize,
      potentialReach: list.potentialReach,
      status: list.status,
      createdAt: list.createdAt.toISOString(),
      updatedAt: list.updatedAt.toISOString(),
      clientId: list.clientId,
    };
    const result = await this.api.put<AudienceListDto>(`/api/audiences/${encodeURIComponent(list.id)}`, dto);
    return mapDtoToList(result);
  }

  async delete(id: string): Promise<void> {
    await this.api.delete<void>(`/api/audiences/${encodeURIComponent(id)}`);
  }
}