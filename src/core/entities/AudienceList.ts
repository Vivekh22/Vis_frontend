/**
 * AudienceList.ts — core/entities/
 *
 * A targetable audience list — a collection of user identifiers or
 * demographic segments used for campaign targeting.
 *
 * Completely redesigned for production-ready Audience module:
 * includes audience type, business/product, rich rules engine configuration,
 * estimated size/reach, and status.
 */
import type { AudienceDataSource } from '../enums/AudienceDataSource';

export type AudienceType = 'custom' | 'lookalike' | 'saved';
export type AudienceStatus = 'active' | 'processing' | 'archived' | 'failed';

export interface AudienceDataSourceConfig {
  type: AudienceDataSource;
  csvData?: string;      
  apiUrl?: string;       
  apiKey?: string;       
  csvLinkUrl?: string;   
  validated: boolean;
  // Specific configs for V4Connectt sources
  activityWindowDays?: number;
  selectedEvents?: string[];
  selectedProducts?: string[];
}

export interface AudienceRule {
  type: 'location' | 'interest' | 'behavior' | 'demographic';
  action: 'include' | 'exclude';
  details: Record<string, unknown>; // e.g. { country: 'India', state: 'Karnataka' }
}

export class AudienceList {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly audienceType: AudienceType,
    public readonly businessProduct: string,
    public readonly dataSource: AudienceDataSourceConfig,
    public readonly rules: AudienceRule[],
    private _estimatedSize: number,
    private _potentialReach: [number, number],
    private _status: AudienceStatus = 'processing',
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly clientId: string = 'client-1',
  ) {
    if (_estimatedSize < 0) {
      throw new Error('Audience list size cannot be negative');
    }
  }

  public get estimatedSize(): number {
    return this._estimatedSize;
  }

  public get potentialReach(): [number, number] {
    return this._potentialReach;
  }

  public get status(): AudienceStatus {
    return this._status;
  }

  public updateSize(newSize: number, newReach: [number, number]): void {
    if (newSize < 0) {
      throw new Error('Audience list size cannot be negative');
    }
    this._estimatedSize = newSize;
    this._potentialReach = newReach;
  }

  public updateStatus(newStatus: AudienceStatus): void {
    this._status = newStatus;
  }
}