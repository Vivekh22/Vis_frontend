/**
 * ReportRepository.ts — repositories/
 *
 * Real implementation of the ReportRepository interface from ReportService.
 * Calls the report API endpoints and maps DTOs to domain types.
 *
 * Assumed endpoint shape (de facto API contract):
 *   GET  /api/reports/activity-log?userId=&action=&startDate=&endDate=
 *     Response: ActivityLogEntryDto[]
 *   POST /api/reports/generate
 *     Body: { type: string, filters: ReportFilter }
 *     Response: ReportDto
 *   POST /api/reports/schedule
 *     Body: ScheduleReportConfigDto
 *   GET  /api/reports/history
 *     Response: ReportDto[]
 *
 *   ActivityLogEntryDto: {
 *     id: string, action: string, actorId: string, actorName: string,
 *     timestamp: string (ISO), details: string | null
 *   }
 *   ReportDto: {
 *     id: string, type: string, generatedAt: string (ISO), data: unknown
 *   }
 */
import type {
  ActivityLogEntry,
  Report,
  ActivityLogFilter,
  ReportFilter,
  ScheduleReportConfig,
  ReportRepository as IReportRepository,
} from '../services/ReportService';
import { ApiClient } from './ApiClient';

interface ActivityLogEntryDto {
  id: string;
  action: string;
  actorId: string;
  actorName: string;
  timestamp: string;
  details: string | null;
}

interface ReportDto {
  id: string;
  type: string;
  generatedAt: string;
  data: unknown;
}

interface ScheduleReportConfigDto {
  type: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  filters: ReportFilter;
}

export function mapDtoToActivityLogEntry(dto: ActivityLogEntryDto): ActivityLogEntry {
  return {
    id: dto.id,
    action: dto.action,
    actorId: dto.actorId,
    actorName: dto.actorName,
    timestamp: new Date(dto.timestamp),
    details: dto.details,
  };
}

export function mapDtoToReport(dto: ReportDto): Report {
  return {
    id: dto.id,
    type: dto.type,
    generatedAt: new Date(dto.generatedAt),
    data: dto.data,
  };
}

export class ReportRepository implements IReportRepository {
  constructor(private readonly api: ApiClient) {}

  async getActivityLog(filters: ActivityLogFilter): Promise<ActivityLogEntry[]> {
    const params = new URLSearchParams();
    if (filters.userId) params.set('userId', filters.userId);
    if (filters.action) params.set('action', filters.action);
    if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.set('endDate', filters.endDate.toISOString());
    const query = params.toString();
    const path = query ? `/api/reports/activity-log?${query}` : '/api/reports/activity-log';
    const dtos = await this.api.get<ActivityLogEntryDto[]>(path);
    return dtos.map(mapDtoToActivityLogEntry);
  }

  async generateReport(type: string, filters: ReportFilter): Promise<Report> {
    const dto = await this.api.post<ReportDto>('/api/reports/generate', { type, filters });
    return mapDtoToReport(dto);
  }

  async scheduleReport(config: ScheduleReportConfig): Promise<void> {
    const dto: ScheduleReportConfigDto = {
      type: config.type,
      frequency: config.frequency,
      filters: config.filters,
    };
    await this.api.post<void>('/api/reports/schedule', dto);
  }

  async getReportHistory(): Promise<Report[]> {
    const dtos = await this.api.get<ReportDto[]>('/api/reports/history');
    return dtos.map(mapDtoToReport);
  }
}