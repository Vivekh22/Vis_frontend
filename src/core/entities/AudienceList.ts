/**
 * AudienceList.ts — core/entities/
 *
 * A targetable audience list — a collection of user identifiers or
 * demographic segments used for campaign targeting.
 *
 * Extended for Part 9: listType (whitelist/blacklist), comments, data
 * source type, and data source configuration.
 */
import type { AudienceDataSource } from '../enums/AudienceDataSource';

export type AudienceListType = 'whitelist' | 'blacklist';

export interface AudienceDataSourceConfig {
  type: AudienceDataSource;
  csvData?: string;      // raw CSV text for csv_file / csv_link
  apiUrl?: string;       // for api
  apiKey?: string;       // for api
  csvLinkUrl?: string;   // for csv_link
  validated: boolean;    // whether the source passed client-side validation
}

export class AudienceList {
  constructor(
    public readonly id: string,
    public readonly name: string,
    private _size: number,
    public readonly createdAt: Date = new Date(),
    public readonly listType: AudienceListType = 'whitelist',
    public readonly comments: string | null = null,
    public readonly dataSource: AudienceDataSourceConfig | null = null,
    public readonly clientId: string = 'client-1',
  ) {
    if (_size < 0) {
      throw new Error('Audience list size cannot be negative');
    }
  }

  public get size(): number {
    return this._size;
  }

  public get userCount(): number {
    return this._size;
  }

  public get whiteListedCount(): number {
    return this.listType === 'whitelist' ? this._size : 0;
  }

  public get blackListedCount(): number {
    return this.listType === 'blacklist' ? this._size : 0;
  }

  public updateSize(newSize: number): void {
    if (newSize < 0) {
      throw new Error('Audience list size cannot be negative');
    }
    this._size = newSize;
  }
}