/**
 * ApprovalRepository.ts — repositories/
 *
 * Real implementation of the ApprovalRepository interface from ApprovalService.
 * Calls the approval API endpoints.
 *
 * Assumed endpoint shape (de facto API contract):
 *   GET  /api/approvals/:id             → ApprovalItemDto
 *   GET  /api/approvals?status=&clientId= → ApprovalItemDto[]
 *   POST /api/approvals/:id/approve     Body: { note: string, actorId: string }
 *   POST /api/approvals/:id/reject      Body: { note: string, actorId: string }
 *   POST /api/approvals/:id/request-changes Body: { note: string, actorId: string }
 *
 *   ApprovalItemDto: {
 *     id: string, itemType: 'campaign' | 'creative',
 *     itemId: string, itemName: string, clientId: string,
 *     submittedBy: string, submittedAt: string (ISO),
 *     status: CampaignStatus | CreativeStatus, note: string | null
 *   }
 */
import { ApprovalItem } from '../core/entities/ApprovalItem';
import type { ApprovalItemType } from '../core/entities/ApprovalItem';
import type { CampaignStatus } from '../core/enums/CampaignStatus';
import type { CreativeStatus } from '../core/enums/CreativeStatus';
import type { ApprovalFilter, ApprovalRepository as IApprovalRepository } from '../services/ApprovalService';
import { ApiClient } from './ApiClient';
import { ApiError } from '../core/errors/ApiError';

interface ApprovalItemDto {
  id: string;
  itemType: ApprovalItemType;
  itemId: string;
  itemName: string;
  clientId: string;
  submittedBy: string;
  submittedAt: string;
  status: CampaignStatus | CreativeStatus;
  note: string | null;
}

export function mapDtoToApprovalItem(dto: ApprovalItemDto): ApprovalItem {
  return new ApprovalItem(
    dto.id,
    dto.itemType,
    dto.itemId,
    dto.itemName,
    dto.clientId,
    dto.submittedBy,
    new Date(dto.submittedAt),
    dto.status,
    dto.note,
  );
}

export class ApprovalRepository implements IApprovalRepository {
  constructor(private readonly api: ApiClient) {}

  async findById(id: string): Promise<ApprovalItem | null> {
    try {
      const dto = await this.api.get<ApprovalItemDto>(`/api/approvals/${encodeURIComponent(id)}`);
      return mapDtoToApprovalItem(dto);
    } catch (err) {
      if (err instanceof ApiError && err.isNotFound) return null;
      throw err;
    }
  }

  async findAll(filter?: ApprovalFilter): Promise<ApprovalItem[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.clientId) params.set('clientId', filter.clientId);
    const query = params.toString();
    const path = query ? `/api/approvals?${query}` : '/api/approvals';
    const dtos = await this.api.get<ApprovalItemDto[]>(path);
    return dtos.map(mapDtoToApprovalItem);
  }

  async approve(id: string, note: string, actorId: string): Promise<void> {
    await this.api.post<void>(
      `/api/approvals/${encodeURIComponent(id)}/approve`,
      { note, actorId },
    );
  }

  async reject(id: string, note: string, actorId: string): Promise<void> {
    await this.api.post<void>(
      `/api/approvals/${encodeURIComponent(id)}/reject`,
      { note, actorId },
    );
  }

  async requestChanges(id: string, note: string, actorId: string): Promise<void> {
    await this.api.post<void>(
      `/api/approvals/${encodeURIComponent(id)}/request-changes`,
      { note, actorId },
    );
  }
}