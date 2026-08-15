/**
 * CampaignRepository.ts — repositories/
 *
 * Real implementation of the CampaignRepository interface from CampaignService.
 * Calls the campaign API endpoints and maps DTOs to Campaign domain entities.
 *
 * Assumed endpoint shape (de facto API contract):
 *   GET    /api/campaigns/:id           → CampaignDto
 *   GET    /api/campaigns?clientId=&status= → CampaignDto[]
 *   PUT    /api/campaigns/:id           (upsert) → CampaignDto
 *   DELETE /api/campaigns/:id
 *
 *   CampaignDto: {
 *     id: string, name: string, clientId: string,
 *     budget: { amountMinorUnits: number, currency: string },
 *     optimizationGoal: OptimizationGoal,
 *     startDate: string (ISO), endDate: string (ISO),
 *     status: CampaignStatus, createdAt: string (ISO)
 *   }
 *
 * The mapper translates ISO date strings → Date objects and Money DTOs →
 * Money value objects, ensuring services only ever work with real domain
 * entities — never raw API JSON.
 */
import { Campaign } from '../core/entities/Campaign';
import { Money } from '../core/value-objects/Money';
import type { CampaignStatus } from '../core/enums/CampaignStatus';
import type { OptimizationGoal } from '../core/enums/OptimizationGoal';
import type { CampaignFilter, CampaignRepository as ICampaignRepository } from '../services/CampaignService';
import { ApiClient } from './ApiClient';
import { ApiError } from '../core/errors/ApiError';

interface MoneyDto {
  amountMinorUnits: number;
  currency: string;
}

interface CampaignDto {
  id: string;
  name: string;
  clientId: string;
  budget: MoneyDto;
  optimizationGoal: OptimizationGoal;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  createdAt: string;
}

function mapMoneyToDto(money: Money): MoneyDto {
  return { amountMinorUnits: money.getAmountMinorUnits(), currency: money.getCurrency() };
}

function mapDtoToMoney(dto: MoneyDto): Money {
  return new Money(dto.amountMinorUnits, dto.currency);
}

export function mapCampaignToDto(campaign: Campaign): CampaignDto {
  return {
    id: campaign.id,
    name: campaign.name,
    clientId: campaign.clientId,
    budget: mapMoneyToDto(campaign.getBudget()),
    optimizationGoal: campaign.getOptimizationGoal(),
    startDate: campaign.startDate.toISOString(),
    endDate: campaign.endDate.toISOString(),
    status: campaign.status,
    createdAt: campaign.createdAt.toISOString(),
  };
}

export function mapDtoToCampaign(dto: CampaignDto): Campaign {
  return new Campaign(
    dto.id,
    dto.name,
    dto.clientId,
    mapDtoToMoney(dto.budget),
    dto.optimizationGoal,
    new Date(dto.startDate),
    new Date(dto.endDate),
    dto.status,
    new Date(dto.createdAt),
  );
}

export class CampaignRepository implements ICampaignRepository {
  constructor(private readonly api: ApiClient) {}

  async findById(id: string): Promise<Campaign | null> {
    try {
      const dto = await this.api.get<CampaignDto>(`/api/campaigns/${encodeURIComponent(id)}`);
      return mapDtoToCampaign(dto);
    } catch (err) {
      if (err instanceof ApiError && err.isNotFound) return null;
      throw err;
    }
  }

  async findAll(filter?: CampaignFilter): Promise<Campaign[]> {
    const params = new URLSearchParams();
    if (filter?.clientId) params.set('clientId', filter.clientId);
    if (filter?.status) params.set('status', filter.status);
    const query = params.toString();
    const path = query ? `/api/campaigns?${query}` : '/api/campaigns';
    const dtos = await this.api.get<CampaignDto[]>(path);
    return dtos.map(mapDtoToCampaign);
  }

  async save(campaign: Campaign): Promise<Campaign> {
    const dto = await this.api.put<CampaignDto>(
      `/api/campaigns/${encodeURIComponent(campaign.id)}`,
      mapCampaignToDto(campaign),
    );
    return mapDtoToCampaign(dto);
  }

  async delete(id: string): Promise<void> {
    await this.api.delete<void>(`/api/campaigns/${encodeURIComponent(id)}`);
  }
}